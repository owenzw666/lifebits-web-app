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
    }
}
