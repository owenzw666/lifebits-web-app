using Lifebits.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class CreatePlaceWithNoteDto : IValidatableObject
    {
        [MaxLength(120)]
        public string? Name {  get; set; }

        [Required]
        public GeoJsonPoint Location { get; set; } = new();

        [MaxLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        // Category is a stable key such as Life, Work, Travel, or Other.
        [MaxLength(32)]
        public string Category { get; set; } = "Life";

        // The user-selected time when this first note happened.
        public DateTime EventTime { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (!string.Equals(Location.Type, "Point", StringComparison.OrdinalIgnoreCase))
            {
                yield return new ValidationResult(
                    "Location type must be Point.",
                    new[] { nameof(Location) });
                yield break;
            }

            if (Location.Coordinates.Length != 2)
            {
                yield return new ValidationResult(
                    "Location must contain longitude and latitude.",
                    new[] { nameof(Location) });
                yield break;
            }

            var longitude = Location.Coordinates[0];
            var latitude = Location.Coordinates[1];

            if (!double.IsFinite(longitude) ||
                !double.IsFinite(latitude) ||
                longitude < -180 ||
                longitude > 180 ||
                latitude < -90 ||
                latitude > 90)
            {
                yield return new ValidationResult(
                    "Location coordinates are invalid.",
                    new[] { nameof(Location) });
            }
        }
    }
}
