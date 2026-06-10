using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class TokenRequestDto
    {
        [Required]
        [MaxLength(500)]
        public string Token { get; set; } = string.Empty;
    }
}
