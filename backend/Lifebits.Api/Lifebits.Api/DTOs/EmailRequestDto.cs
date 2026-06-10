using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class EmailRequestDto
    {
        [Required]
        [EmailAddress]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;
    }
}
