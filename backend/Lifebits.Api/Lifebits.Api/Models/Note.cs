namespace Lifebits.Api.Models
{
    public class Note
    {
        public int Id { get; set; }

        /// <summary>
        /// The title of the note
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// The content of the note.
        /// </summary>
        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime EventTime { get; set; }

        public int PlaceId { get; set; }
        public Place Place { get; set; } = null!;

        public int UserId { get; set; }
        public AppUser User { get; set; } = null!;

    }
}
