namespace Lifebits.Api.Models
{
    public class AppUser
    {
        public int Id { get; set; }

        public string Email { get; set; }=string.Empty;

        // PasswordHash is nullable because OAuth users may not have a local password.
        public string? PasswordHash { get; set; }

        // AuthProvider keeps the first sign-in method visible for future account logic.
        // Local means email/password. Google will be used after OAuth is fully configured.
        public string AuthProvider { get; set; } = "Local";

        // ProviderUserId stores the stable id from Google, Facebook, or another OAuth provider.
        public string? ProviderUserId { get; set; }

        // These profile fields are optional, but useful for social sign-in later.
        public string? DisplayName { get; set; }

        public string? AvatarUrl { get; set; }

        // Existing accounts are treated as verified by the migration.
        // New local accounts explicitly set this to false during registration.
        public bool IsEmailVerified { get; set; } = true;

        // Incrementing this value invalidates JWTs issued before a password reset.
        public int TokenVersion { get; set; }

        public DateTime CreatAt { get; set; } = DateTime.UtcNow;

        public List<AccountToken> AccountTokens { get; set; } = new();

        // A user can link more than one external provider without changing the main account.
        public List<ExternalLogin> ExternalLogins { get; set; } = new();
    }
}
