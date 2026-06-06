using System.ComponentModel.DataAnnotations;

namespace Lifebits.Api.DTOs
{
    public class UpdatePlaceDto
    {
        // An empty name is allowed. The frontend will show "Place #id" as a fallback.
        [MaxLength(120)]
        public string? Name { get; set; }
    }
}
