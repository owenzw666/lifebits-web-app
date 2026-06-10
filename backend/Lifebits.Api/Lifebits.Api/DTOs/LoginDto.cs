using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class LoginDto
    {
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(128)]
        public string Password { get; set; } = string.Empty;
    }
}
