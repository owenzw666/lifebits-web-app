using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{

    public class CreateNoteDto
    {
        [Required]
        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        [Required]
        public double Lng { get; set; }

        [Required]
        public double Lat { get; set; }

        // ⭐ 用户可设置的时间
        public string? EventTime { get; set; }
    }
}
