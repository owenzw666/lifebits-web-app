namespace Lifebits.Api.Models
{
    public class AppUser
    {
        public int Id { get; set; }

        public string Email { get; set; }=string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatAt { get; set; } = DateTime.UtcNow;
    }
}
