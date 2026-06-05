using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class GoogleLoginDto
    {
        // Google will return this token after the user signs in on the frontend.
        // The backend must verify it before trusting the user's email or Google id.
        [Required]
        public string IdToken { get; set; } = string.Empty;
    }
}
