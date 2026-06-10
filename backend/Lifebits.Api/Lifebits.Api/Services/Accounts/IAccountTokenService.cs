using Lifebits.Api.Models;

namespace Lifebits.Api.Services.Accounts
{
    public interface IAccountTokenService
    {
        Task<string> CreateAsync(
            AppUser user,
            string type,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default);

        Task<AccountToken?> ConsumeAsync(
            string rawToken,
            string type,
            CancellationToken cancellationToken = default);

        Task<string> CreateSessionAsync(
            AppUser user,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default);

        Task<(AppUser User, string Token)?> RotateSessionAsync(
            string rawToken,
            TimeSpan lifetime,
            CancellationToken cancellationToken = default);

        Task RevokeSessionAsync(
            string rawToken,
            CancellationToken cancellationToken = default);

        Task RevokeAllSessionsAsync(
            int userId,
            CancellationToken cancellationToken = default);
    }
}
