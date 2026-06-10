using Lifebits.Api.Models;

namespace Lifebits.Api.Services.Email
{
    public class DevelopmentAccountEmailSender : IAccountEmailSender
    {
        private readonly ILogger<DevelopmentAccountEmailSender> _logger;

        public DevelopmentAccountEmailSender(
            ILogger<DevelopmentAccountEmailSender> logger)
        {
            _logger = logger;
        }

        public Task SendEmailVerificationAsync(
            AppUser user,
            string verificationUrl,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "Development email verification for {Email}: {VerificationUrl}",
                user.Email,
                verificationUrl);

            return Task.CompletedTask;
        }

        public Task SendPasswordResetAsync(
            AppUser user,
            string resetUrl,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "Development password reset for {Email}: {ResetUrl}",
                user.Email,
                resetUrl);

            return Task.CompletedTask;
        }
    }
}
