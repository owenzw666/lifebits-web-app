using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class UpdateNoteDto
    {
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        // Category is stored as a stable key so display labels can change later.
        [MaxLength(32)]
        public string Category { get; set; } = "Life";

        // The user-selected time when this note happened.
        public DateTime EventTime { get; set; }
    }
}
