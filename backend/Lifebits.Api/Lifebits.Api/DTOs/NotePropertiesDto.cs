namespace Lifebits.Api.DTOs
{
    public class NotePropertiesDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
        public string Category { get; set; } = "Life";
        public DateTime EventTime { get; set; }
        public List<NotePhotoDto> Photos { get; set; } = [];
    }
}
