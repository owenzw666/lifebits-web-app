namespace Lifebits.Api.DTOs
{
    public class TimelinePageDto
    {
        public List<TimelineItemDto> Items { get; set; } = [];
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public bool HasMore { get; set; }
    }
}
