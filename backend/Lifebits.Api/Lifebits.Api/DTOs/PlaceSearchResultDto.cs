namespace Lifebits.Api.DTOs
{
    public class PlaceSearchResultDto
    {
        public string Name { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public double Longitude { get; set; }
        public double Latitude { get; set; }
    }
}
