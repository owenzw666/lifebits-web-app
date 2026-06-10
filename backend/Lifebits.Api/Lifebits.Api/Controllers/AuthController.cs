using BCrypt.Net;
using Lifebits.Api.Data;
using Lifebits.Api.DTOs;
using Lifebits.Api.Models;
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

        public AuthController(AppDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
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
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
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

            return Ok("User registered");
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

            return Ok(new { token });
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
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("auth_provider", user.AuthProvider)
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
    }
}
