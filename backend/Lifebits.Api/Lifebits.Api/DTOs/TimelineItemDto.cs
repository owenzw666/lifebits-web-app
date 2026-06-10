namespace Lifebits.Api.DTOs
{
    public class TimelineItemDto
    {
        public int NoteId { get; set; }
        public int PlaceId { get; set; }
        public string? PlaceName { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Category { get; set; } = "Life";
        public DateTime EventTime { get; set; }
        public double[] Coordinates { get; set; } = [];
        public List<NotePhotoDto> Photos { get; set; } = [];
    }
}
