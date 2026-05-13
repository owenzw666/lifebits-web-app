namespace Lifebits.Api.DTOs
{
    public class NotePropertiesDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = "";
        public string Content { get; set; } = "";
        public DateTime EventTime { get; set; }
    }
}
