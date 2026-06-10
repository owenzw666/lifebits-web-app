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

            var rawToken = CreateRawToken();

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

            // Claim the token with a conditional update. Only one concurrent
            // request can change UsedAt from null, so single-use tokens stay single-use.
            var affectedRows = await _context.AccountTokens
                .Where(item =>
                    item.TokenHash == tokenHash &&
                    item.Type == type &&
                    item.UsedAt == null &&
                    item.ExpiresAt > now)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.UsedAt, now),
                    cancellationToken);

            if (affectedRows != 1)
            {
                return null;
            }

            return await _context.AccountTokens
                .Include(item => item.User)
                .FirstAsync(
                    item => item.TokenHash == tokenHash && item.Type == type,
                    cancellationToken);
        }

        public async Task<string> CreateSessionAsync(
            AppUser user,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default)
        {
            var rawToken = CreateRawToken();

            _context.AccountTokens.Add(new AccountToken
            {
                Type = AccountTokenTypes.RefreshSession,
                TokenHash = HashToken(rawToken),
                ExpiresAt = DateTime.UtcNow.Add(lifetime),
                UserId = user.Id
            });

            await _context.SaveChangesAsync(cancellationToken);
            return rawToken;
        }

        public async Task<(AppUser User, string Token)?> RotateSessionAsync(
            string rawToken,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default)
        {
            var tokenHash = HashToken(rawToken);
            var now = DateTime.UtcNow;

            await using var transaction =
                await _context.Database.BeginTransactionAsync(cancellationToken);

            var userId = await _context.AccountTokens
                .AsNoTracking()
                .Where(item =>
                    item.TokenHash == tokenHash &&
                    item.Type == AccountTokenTypes.RefreshSession &&
                    item.UsedAt == null &&
                    item.ExpiresAt > now)
                .Select(item => (int?)item.UserId)
                .FirstOrDefaultAsync(cancellationToken);

            if (!userId.HasValue)
            {
                return null;
            }

            // Rotation prevents a copied refresh token from being reused.
            var affectedRows = await _context.AccountTokens
                .Where(item =>
                    item.TokenHash == tokenHash &&
                    item.Type == AccountTokenTypes.RefreshSession &&
                    item.UsedAt == null &&
                    item.ExpiresAt > now)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.UsedAt, now),
                    cancellationToken);

            if (affectedRows != 1)
            {
                return null;
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(item => item.Id == userId.Value, cancellationToken);

            if (user == null || !user.IsEmailVerified)
            {
                await transaction.CommitAsync(cancellationToken);
                return null;
            }

            var replacementToken = CreateRawToken();

            _context.AccountTokens.Add(new AccountToken
            {
                Type = AccountTokenTypes.RefreshSession,
                TokenHash = HashToken(replacementToken),
                ExpiresAt = now.Add(lifetime),
                UserId = user.Id
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return (user, replacementToken);
        }

        public async Task RevokeSessionAsync(
            string rawToken,
            CancellationToken cancellationToken = default)
        {
            var tokenHash = HashToken(rawToken);
            var now = DateTime.UtcNow;

            await _context.AccountTokens
                .Where(item =>
                    item.TokenHash == tokenHash &&
                    item.Type == AccountTokenTypes.RefreshSession &&
                    item.UsedAt == null)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.UsedAt, now),
                    cancellationToken);
        }

        public async Task RevokeAllSessionsAsync(
            int userId,
            CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;

            await _context.AccountTokens
                .Where(item =>
                    item.UserId == userId &&
                    item.Type == AccountTokenTypes.RefreshSession &&
                    item.UsedAt == null)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.UsedAt, now),
                    cancellationToken);
        }

        private static string CreateRawToken() =>
            WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));

        private static string HashToken(string token)
        {
            return Convert.ToHexString(
                SHA256.HashData(Encoding.UTF8.GetBytes(token)));
        }
    }
}
