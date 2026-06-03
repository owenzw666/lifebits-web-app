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

        // Store a stable category key instead of display text.
        // This keeps old data safe if the UI wording changes later.
        public string Category { get; set; } = "Life";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime EventTime { get; set; }

        public int PlaceId { get; set; }
        public Place Place { get; set; } = null!;

        public int UserId { get; set; }
        public AppUser User { get; set; } = null!;

    }
}
