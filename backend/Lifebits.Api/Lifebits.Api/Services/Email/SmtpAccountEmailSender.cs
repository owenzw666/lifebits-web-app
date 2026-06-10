using Lifebits.Api.Models;
using System.Net;
using System.Net.Mail;

namespace Lifebits.Api.Services.Email
{
    public class SmtpAccountEmailSender : IAccountEmailSender
    {
        private readonly IConfiguration _configuration;

        public SmtpAccountEmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task SendEmailVerificationAsync(
            AppUser user,
            string verificationUrl,
            CancellationToken cancellationToken = default)
        {
            return SendAsync(
                user.Email,
                "Verify your Lifebits email",
                $"Verify your email by opening this link:\n\n{verificationUrl}",
                cancellationToken);
        }

        public Task SendPasswordResetAsync(
            AppUser user,
            string resetUrl,
            CancellationToken cancellationToken = default)
        {
            return SendAsync(
                user.Email,
                "Reset your Lifebits password",
                $"Reset your password by opening this link:\n\n{resetUrl}\n\n" +
                "If you did not request this, you can ignore this email.",
                cancellationToken);
        }

        private async Task SendAsync(
            string recipient,
            string subject,
            string body,
            CancellationToken cancellationToken)
        {
            var host = GetRequiredConfig("Email:Smtp:Host");
            var port = _configuration.GetValue("Email:Smtp:Port", 587);
            var username = _configuration["Email:Smtp:Username"];
            var password = _configuration["Email:Smtp:Password"];
            var fromEmail = GetRequiredConfig("Email:FromEmail");
            var fromName = _configuration["Email:FromName"] ?? "Lifebits";
            var enableSsl = _configuration.GetValue("Email:Smtp:EnableSsl", true);

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            message.To.Add(recipient);

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl
            };

            if (!string.IsNullOrWhiteSpace(username))
            {
                client.Credentials = new NetworkCredential(username, password);
            }

            cancellationToken.ThrowIfCancellationRequested();
            await client.SendMailAsync(message, cancellationToken);
        }

        private string GetRequiredConfig(string key)
        {
            var value = _configuration[key];

            if (string.IsNullOrWhiteSpace(value))
            {
                throw new InvalidOperationException(
                    $"Missing required email configuration value: {key}");
            }

            return value;
        }
    }
}
