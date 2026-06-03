using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class CreateNoteDto
    {
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        // Category is a stable key such as Life, Work, Travel, or Other.
        [MaxLength(32)]
        public string Category { get; set; } = "Life";

        // The user-selected time when this note happened.
        public DateTime EventTime { get; set; }
    }
}
