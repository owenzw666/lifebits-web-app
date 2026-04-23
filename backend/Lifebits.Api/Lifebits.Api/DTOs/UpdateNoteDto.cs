using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{

    public class UpdateNoteDto
    {

        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        public double Lng { get; set; }

        public double Lat { get; set; }

        // ⭐ 用户可设置的时间
        public string? EventTime { get; set; }
    }
}
