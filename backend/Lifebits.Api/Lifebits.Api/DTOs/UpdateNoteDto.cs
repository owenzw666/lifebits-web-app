using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{

    public class UpdateNoteDto
    {
        [Required]
        [MaxLength(100)]
        public string? Title { get; set; }

        [Required]
        [MaxLength(1000)]
        public string? Content { get; set; }

        public DateTime? EventTime { get; set; }
    }
}
