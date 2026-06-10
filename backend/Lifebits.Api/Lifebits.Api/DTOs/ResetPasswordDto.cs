using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class ResetPasswordDto
    {
        [Required]
        [MaxLength(500)]
        public string Token { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        [MaxLength(128)]
        public string NewPassword { get; set; } = string.Empty;
    }
}
