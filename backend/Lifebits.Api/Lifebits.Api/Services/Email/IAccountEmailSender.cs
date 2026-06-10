using Lifebits.Api.Models;

namespace Lifebits.Api.Services.Email
{
    public interface IAccountEmailSender
    {
        Task SendEmailVerificationAsync(
            AppUser user,
            string verificationUrl,
            CancellationToken cancellationToken = default);

        Task SendPasswordResetAsync(
            AppUser user,
            string resetUrl,
            CancellationToken cancellationToken = default);
    }
}
