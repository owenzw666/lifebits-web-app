using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class RegisterDto
    {
        [Required]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Password { get; set; } = string.Empty;
    }
}
