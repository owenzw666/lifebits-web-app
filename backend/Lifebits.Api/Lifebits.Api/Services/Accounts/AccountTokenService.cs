using Lifebits.Api.Data;
using Lifebits.Api.Models;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Lifebits.Api.Services.Accounts
{
    public class AccountTokenService : IAccountTokenService
    {
        private readonly AppDbContext _context;

        public AccountTokenService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> CreateAsync(
            AppUser user,
            string type,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default)
        {
            // Only the newest unused token of each type should remain valid.
            var previousTokens = await _context.AccountTokens
                .Where(token =>
                    token.UserId == user.Id &&
                    token.Type == type &&
                    token.UsedAt == null)
                .ToListAsync(cancellationToken);

            var now = DateTime.UtcNow;

            foreach (var previousToken in previousTokens)
            {
                previousToken.UsedAt = now;
            }

            var rawToken = WebEncoders.Base64UrlEncode(
                RandomNumberGenerator.GetBytes(32));

            _context.AccountTokens.Add(new AccountToken
            {
                Type = type,
                TokenHash = HashToken(rawToken),
                ExpiresAt = now.Add(lifetime),
                UserId = user.Id
            });

            await _context.SaveChangesAsync(cancellationToken);
            return rawToken;
        }

        public async Task<AccountToken?> ConsumeAsync(
            string rawToken,
            string type,
            CancellationToken cancellationToken = default)
        {
            var tokenHash = HashToken(rawToken);
            var now = DateTime.UtcNow;

            var token = await _context.AccountTokens
                .Include(item => item.User)
                .FirstOrDefaultAsync(item =>
                    item.TokenHash == tokenHash &&
                    item.Type == type &&
                    item.UsedAt == null &&
                    item.ExpiresAt > now,
                    cancellationToken);

            if (token == null)
            {
                return null;
            }

            token.UsedAt = now;
            return token;
        }

        private static string HashToken(string token)
        {
            return Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        }
    }
}
