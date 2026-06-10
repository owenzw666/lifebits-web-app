namespace Lifebits.Api.Models
{
    public class AccountToken
    {
        public int Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string TokenHash { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UsedAt { get; set; }

        public int UserId { get; set; }
        public AppUser User { get; set; } = null!;
    }
}
