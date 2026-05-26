using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class UpdateNoteDto
    {
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        // The user-selected time when this note happened.
        public DateTime EventTime { get; set; }
    }
}
