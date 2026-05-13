using Lifebits.Api.Models;
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

        [Required]
        public GeoJsonPoint Location { get; set; } = new();

        // ⭐ 用户可设置的时间
        public DateTime EventTime { get; set; }
    }
}
