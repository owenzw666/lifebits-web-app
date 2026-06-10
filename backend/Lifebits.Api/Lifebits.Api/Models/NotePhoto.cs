namespace Lifebits.Api.Models
{
    public class NotePhoto
    {
        public int Id { get; set; }
        public string StorageKey { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long SizeBytes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int NoteId { get; set; }
        public Note Note { get; set; } = null!;
    }
}
