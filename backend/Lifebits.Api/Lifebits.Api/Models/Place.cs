namespace Lifebits.Api.Models
{
    public class Place
    {
        public int Id { get; set; }

        /// <summary>
        /// Place Name
        /// </summary>
        public string? Name { get; set; } = string.Empty;

        /// <summary>
        /// The location of the place
        /// </summary>
        public GeoJsonPoint Location { get; set; } = new();

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int UserId { get; set; }
        public AppUser User { get; set; } = null!;

        public List<Note> Notes { get; set; } = new();
    }
}
