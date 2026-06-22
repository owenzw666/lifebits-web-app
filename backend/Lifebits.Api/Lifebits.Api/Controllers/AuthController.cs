using BCrypt.Net;
using Google.Apis.Auth;
using Lifebits.Api.Data;
using Lifebits.Api.DTOs;
using Lifebits.Api.Models;
using Lifebits.Api.Services.Accounts;
using Lifebits.Api.Services.Email;
using Lifebits.Api.Services.PhotoStorage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Lifebits.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private const string RefreshCookieName = "lifebits-refresh";
        private const string WebClientHeader = "X-Lifebits-Client";
        private const string GoogleProvider = "Google";
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IAccountTokenService _accountTokenService;
        private readonly IAccountEmailSender _emailSender;
        private readonly IPhotoStorage _photoStorage;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            AppDbContext context,
            IConfiguration config,
            IAccountTokenService accountTokenService,
            IAccountEmailSender emailSender,
            IPhotoStorage photoStorage,
            IWebHostEnvironment environment,
            ILogger<AuthController> logger)
        {
            _context = context;
            _config = config;
            _accountTokenService = accountTokenService;
            _emailSender = emailSender;
            _photoStorage = photoStorage;
            _environment = environment;
            _logger = logger;
        }

        [HttpPost("register")]
        [EnableRateLimiting("authentication")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();

            if (await _context.Users.AnyAsync(u => u.Email == email))
            {
                return Conflict("Email is already registered");
            }

            AppUser user = new AppUser()
            {
                Email = email,
                AuthProvider = "Local",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                IsEmailVerified = false
            };

            _context.Users.Add(user);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                // The unique email index also protects against simultaneous registrations.
                if (await _context.Users.AsNoTracking().AnyAsync(u => u.Email == email))
                {
                    return Conflict("Email is already registered");
                }

                throw;
            }

            var verificationToken = await _accountTokenService.CreateAsync(
                user,
                AccountTokenTypes.EmailVerification,
                TimeSpan.FromHours(24));
            var verificationUrl = BuildFrontendUrl(
                "/verify-email",
                verificationToken);

            await _emailSender.SendEmailVerificationAsync(
                user,
                verificationUrl);

            return Ok(new
            {
                message = "Account created. Check your email to verify your address.",
                developmentLink = GetDevelopmentLink(verificationUrl)
            });
        }

        [HttpPost("Login")]
        [EnableRateLimiting("authentication")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();

            var user = await _context.Users.FirstOrDefaultAsync(x => x.Email == email);

            if (user == null ||
                string.IsNullOrWhiteSpace(user.PasswordHash) ||
                !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            {
                return Unauthorized("Invalid email or password");
            }

            if (!user.IsEmailVerified)
            {
                return StatusCode(
                    StatusCodes.Status403Forbidden,
                    "Verify your email before signing in.");
            }

            var refreshToken = await _accountTokenService.CreateSessionAsync(
                user,
                GetRefreshTokenLifetime());
            SetRefreshCookie(refreshToken);
            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user.Email,
                user.IsEmailVerified
            });
        }

        [HttpPost("refresh")]
        [EnableRateLimiting("authentication")]
        public async Task<IActionResult> Refresh(CancellationToken cancellationToken)
        {
            if (!IsTrustedWebClient() ||
                !Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) ||
                string.IsNullOrWhiteSpace(refreshToken))
            {
                DeleteRefreshCookie();
                return Unauthorized();
            }

            var rotatedSession = await _accountTokenService.RotateSessionAsync(
                refreshToken,
                GetRefreshTokenLifetime(),
                cancellationToken);

            if (rotatedSession == null)
            {
                DeleteRefreshCookie();
                return Unauthorized();
            }

            SetRefreshCookie(rotatedSession.Value.Token);

            return Ok(CreateLoginResponse(rotatedSession.Value.User));
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout(CancellationToken cancellationToken)
        {
            if (IsTrustedWebClient() &&
                Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) &&
                !string.IsNullOrWhiteSpace(refreshToken))
            {
                await _accountTokenService.RevokeSessionAsync(
                    refreshToken,
                    cancellationToken);
            }

            DeleteRefreshCookie();
            return NoContent();
        }

        [HttpPost("verify-email")]
        [EnableRateLimiting("authentication")]
        public async Task<IActionResult> VerifyEmail([FromBody] TokenRequestDto dto)
        {
            var accountToken = await _accountTokenService.ConsumeAsync(
                dto.Token,
                AccountTokenTypes.EmailVerification);

            if (accountToken == null)
            {
                return BadRequest("This verification link is invalid or has expired.");
            }

            accountToken.User.IsEmailVerified = true;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Email verified. You can now continue to Lifebits."
            });
        }

        [HttpPost("resend-verification")]
        [EnableRateLimiting("authentication")]
        public async Task<IActionResult> ResendVerification(
            [FromBody] EmailRequestDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users
                .FirstOrDefaultAsync(item => item.Email == email);
            string? developmentLink = null;

            if (user != null &&
                user.AuthProvider == "Local" &&
                !user.IsEmailVerified)
            {
                var verificationToken = await _accountTokenService.CreateAsync(
                    user,
                    AccountTokenTypes.EmailVerification,
                    TimeSpan.FromHours(24));
                var verificationUrl = BuildFrontendUrl(
                    "/verify-email",
                    verificationToken);

                await _emailSender.SendEmailVerificationAsync(
                    user,
                    verificationUrl);
                developmentLink = GetDevelopmentLink(verificationUrl);
            }

            // Keep the response identical whether the email exists or not.
            return Ok(new
            {
                message = "If that account needs verification, a new link has been sent.",
                developmentLink
            });
        }

        [HttpPost("forgot-password")]
        [EnableRateLimiting("authentication")]
        public async Task<IActionResult> ForgotPassword(
            [FromBody] EmailRequestDto dto)
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users
                .FirstOrDefaultAsync(item => item.Email == email);
            string? developmentLink = null;

            if (user != null &&
                user.AuthProvider == "Local" &&
                !string.IsNullOrWhiteSpace(user.PasswordHash))
            {
                var resetToken = await _accountTokenService.CreateAsync(
                    user,
                    AccountTokenTypes.PasswordReset,
                    TimeSpan.FromHours(1));
                var resetUrl = BuildFrontendUrl("/reset-password", resetToken);

                await _emailSender.SendPasswordResetAsync(user, resetUrl);
                developmentLink = GetDevelopmentLink(resetUrl);
            }

            // Do not reveal whether an account exists for this email.
            return Ok(new
            {
                message = "If an account exists, a password reset link has been sent.",
                developmentLink
            });
        }

        [HttpPost("reset-password")]
        [EnableRateLimiting("authentication")]
        public async Task<IActionResult> ResetPassword(
            [FromBody] ResetPasswordDto dto)
        {
            var accountToken = await _accountTokenService.ConsumeAsync(
                dto.Token,
                AccountTokenTypes.PasswordReset);

            if (accountToken == null)
            {
                return BadRequest("This password reset link is invalid or has expired.");
            }

            accountToken.User.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
            accountToken.User.TokenVersion++;

            // A reset token is single-use, and all other outstanding reset links
            // should stop working after the password has changed.
            var unusedResetTokens = await _context.AccountTokens
                .Where(item =>
                    item.UserId == accountToken.UserId &&
                    item.Type == AccountTokenTypes.PasswordReset &&
                    item.UsedAt == null)
                .ToListAsync();

            var now = DateTime.UtcNow;

            foreach (var unusedToken in unusedResetTokens)
            {
                unusedToken.UsedAt = now;
            }

            await _context.SaveChangesAsync();
            await _accountTokenService.RevokeAllSessionsAsync(accountToken.UserId);
            DeleteRefreshCookie();

            return Ok(new
            {
                message = "Password updated. Sign in with your new password."
            });
        }

        [HttpPost("google")]
        [EnableRateLimiting("authentication")]
        public async Task<IActionResult> GoogleLogin(
            [FromBody] GoogleLoginDto dto,
            CancellationToken cancellationToken)
        {
            var clientId = GetRequiredConfig("GoogleAuth:ClientId");
            GoogleJsonWebSignature.Payload googleProfile;

            try
            {
                // Validation checks Google's signature, expiry, issuer, and this app's audience.
                googleProfile = await GoogleJsonWebSignature.ValidateAsync(
                    dto.IdToken,
                    new GoogleJsonWebSignature.ValidationSettings
                    {
                        Audience = new[] { clientId }
                    });
            }
            catch (InvalidJwtException)
            {
                return Unauthorized("Google sign-in could not be verified.");
            }

            if (!googleProfile.EmailVerified ||
                string.IsNullOrWhiteSpace(googleProfile.Email) ||
                string.IsNullOrWhiteSpace(googleProfile.Subject))
            {
                return Unauthorized("Google has not verified this email address.");
            }

            var email = googleProfile.Email.Trim().ToLowerInvariant();
            var externalLogin = await _context.ExternalLogins
                .Include(login => login.User)
                .FirstOrDefaultAsync(
                    login =>
                        login.Provider == GoogleProvider &&
                        login.ProviderUserId == googleProfile.Subject,
                    cancellationToken);

            AppUser user;

            if (externalLogin != null)
            {
                user = externalLogin.User;
            }
            else
            {
                // A verified Google email can safely connect to an existing local account.
                user = await _context.Users
                    .FirstOrDefaultAsync(item => item.Email == email, cancellationToken)
                    ?? new AppUser
                    {
                        Email = email,
                        AuthProvider = GoogleProvider,
                        ProviderUserId = googleProfile.Subject,
                        IsEmailVerified = true
                    };

                var existingGoogleLogin = user.Id != 0 &&
                    await _context.ExternalLogins.AnyAsync(
                        login =>
                            login.UserId == user.Id &&
                            login.Provider == GoogleProvider,
                        cancellationToken);

                if (existingGoogleLogin)
                {
                    return Conflict("This Lifebits account is already linked to Google.");
                }

                user.DisplayName ??= googleProfile.Name;
                user.AvatarUrl ??= googleProfile.Picture;
                user.IsEmailVerified = true;

                if (user.Id == 0)
                {
                    _context.Users.Add(user);
                }

                _context.ExternalLogins.Add(new ExternalLogin
                {
                    Provider = GoogleProvider,
                    ProviderUserId = googleProfile.Subject,
                    User = user
                });

                await _context.SaveChangesAsync(cancellationToken);
            }

            var refreshToken = await _accountTokenService.CreateSessionAsync(
                user,
                GetRefreshTokenLifetime(),
                cancellationToken);
            SetRefreshCookie(refreshToken);

            return Ok(CreateLoginResponse(user));
        }

        [Authorize]
        [HttpDelete("account")]
        public async Task<IActionResult> DeleteAccount(
            CancellationToken cancellationToken)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized();
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(item => item.Id == userId, cancellationToken);

            if (user == null)
            {
                DeleteRefreshCookie();
                return NoContent();
            }

            // Save the storage keys before database cascades remove the photo rows.
            var photoStorageKeys = await _context.NotePhotos
                .Where(photo => photo.Note.UserId == userId)
                .Select(photo => photo.StorageKey)
                .ToListAsync(cancellationToken);

            // Notes have a restrictive direct User relationship, so remove the
            // user's places first and let Place -> Note -> Photo cascade safely.
            await using var transaction = await _context.Database
                .BeginTransactionAsync(cancellationToken);
            var places = await _context.Places
                .Where(place => place.UserId == userId)
                .ToListAsync(cancellationToken);

            _context.Places.RemoveRange(places);
            await _context.SaveChangesAsync(cancellationToken);

            _context.Users.Remove(user);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            DeleteRefreshCookie();

            // The account is already removed at this point. A temporary storage
            // failure must not make the client believe that deletion failed.
            foreach (var storageKey in photoStorageKeys)
            {
                try
                {
                    await _photoStorage.DeleteAsync(storageKey, cancellationToken);
                }
                catch (Exception exception)
                {
                    _logger.LogWarning(
                        exception,
                        "Could not delete photo {StorageKey} after deleting user {UserId}.",
                        storageKey,
                        userId);
                }
            }

            return NoContent();
        }

        private string GenerateJwtToken(AppUser user)
        {
            var jwtKey = GetRequiredConfig("Jwt:Key");
            var jwtIssuer = GetRequiredConfig("Jwt:Issuer");
            var jwtAudience = GetRequiredConfig("Jwt:Audience");
            var tokenLifetimeMinutes =
                _config.GetValue("Jwt:AccessTokenLifetimeMinutes", 15);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("auth_provider", user.AuthProvider),
                new Claim("email_verified", user.IsEmailVerified.ToString().ToLowerInvariant()),
                new Claim("token_version", user.TokenVersion.ToString())
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(tokenLifetimeMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GetRequiredConfig(string key)
        {
            var value = _config[key];

            if (string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException($"Missing required configuration value: {key}");
            }

            return value;
        }

        private string BuildFrontendUrl(string path, string token)
        {
            var baseUrl = GetRequiredConfig("Frontend:BaseUrl").TrimEnd('/');
            return $"{baseUrl}{path}?token={Uri.EscapeDataString(token)}";
        }

        private string? GetDevelopmentLink(string url)
        {
            return _environment.IsDevelopment() ? url : null;
        }

        private object CreateLoginResponse(AppUser user) => new
        {
            token = GenerateJwtToken(user),
            user.Email,
            user.IsEmailVerified
        };

        private TimeSpan GetRefreshTokenLifetime() => TimeSpan.FromDays(
            _config.GetValue("Jwt:RefreshTokenLifetimeDays", 30));

        private bool IsTrustedWebClient() =>
            string.Equals(
                Request.Headers[WebClientHeader],
                "LifebitsWeb",
                StringComparison.Ordinal);

        private void SetRefreshCookie(string token)
        {
            Response.Cookies.Append(
                RefreshCookieName,
                token,
                CreateRefreshCookieOptions(GetRefreshTokenLifetime()));
        }

        private void DeleteRefreshCookie()
        {
            Response.Cookies.Delete(
                RefreshCookieName,
                CreateRefreshCookieOptions(TimeSpan.Zero));
        }

        private CookieOptions CreateRefreshCookieOptions(TimeSpan lifetime) => new()
        {
            HttpOnly = true,
            Secure = !_environment.IsDevelopment(),
            SameSite = GetRefreshCookieSameSite(),
            Path = "/",
            MaxAge = lifetime > TimeSpan.Zero ? lifetime : null,
            Expires = lifetime > TimeSpan.Zero
                ? DateTimeOffset.UtcNow.Add(lifetime)
                : DateTimeOffset.UnixEpoch,
            IsEssential = true
        };

        private SameSiteMode GetRefreshCookieSameSite()
        {
            var configuredValue =
                _config["Jwt:RefreshCookieSameSite"] ?? "Lax";

            return Enum.TryParse<SameSiteMode>(
                configuredValue,
                ignoreCase: true,
                out var sameSite)
                    ? sameSite
                    : throw new InvalidOperationException(
                        "Jwt:RefreshCookieSameSite must be Lax, Strict, or None.");
        }
    }
}
