using BCrypt.Net;
using Lifebits.Api.Data;
using Lifebits.Api.DTOs;
using Lifebits.Api.Models;
using Lifebits.Api.Services.Accounts;
using Lifebits.Api.Services.Email;
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
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IAccountTokenService _accountTokenService;
        private readonly IAccountEmailSender _emailSender;
        private readonly IWebHostEnvironment _environment;

        public AuthController(
            AppDbContext context,
            IConfiguration config,
            IAccountTokenService accountTokenService,
            IAccountEmailSender emailSender,
            IWebHostEnvironment environment)
        {
            _context = context;
            _config = config;
            _accountTokenService = accountTokenService;
            _emailSender = emailSender;
            _environment = environment;
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

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                token,
                user.Email,
                user.IsEmailVerified
            });
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

            return Ok(new
            {
                message = "Password updated. Sign in with your new password."
            });
        }

        [HttpPost("google")]
        [EnableRateLimiting("authentication")]
        public IActionResult GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            // This endpoint is intentionally a placeholder until Google OAuth is configured.
            // Later it will verify dto.IdToken against GoogleAuth:ClientId, then find or create a user.
            if (string.IsNullOrWhiteSpace(dto.IdToken))
            {
                return BadRequest("Google id token is required");
            }

            return StatusCode(StatusCodes.Status501NotImplemented, new
            {
                message = "Google sign-in is prepared but not configured yet."
            });
        }

        private string GenerateJwtToken(AppUser user)
        {
            var jwtKey = GetRequiredConfig("Jwt:Key");
            var jwtIssuer = GetRequiredConfig("Jwt:Issuer");
            var jwtAudience = GetRequiredConfig("Jwt:Audience");
            var tokenLifetimeDays = _config.GetValue("Jwt:TokenLifetimeDays", 7);

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
                expires: DateTime.UtcNow.AddDays(tokenLifetimeDays),
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
    }
}
