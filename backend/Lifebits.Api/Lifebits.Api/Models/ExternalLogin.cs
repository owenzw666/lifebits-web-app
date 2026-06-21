namespace Lifebits.Api.Models
{
    public class ExternalLogin
    {
        public int Id { get; set; }

        // Provider identifies the external identity system, such as Google or Facebook.
        public string Provider { get; set; } = string.Empty;

        // ProviderUserId is the stable subject identifier issued by the provider.
        public string ProviderUserId { get; set; } = string.Empty;

        public int UserId { get; set; }

        public AppUser User { get; set; } = null!;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
