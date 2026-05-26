using Lifebits.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class CreatePlaceWithNoteDto
    {
        public string? Name {  get; set; }

        [Required]
        public GeoJsonPoint Location { get; set; } = new();

        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        // The user-selected time when this first note happened.
        public DateTime EventTime { get; set; }
    }
}
