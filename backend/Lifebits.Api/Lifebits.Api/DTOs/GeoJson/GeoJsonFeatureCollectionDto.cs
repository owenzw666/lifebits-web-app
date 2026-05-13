namespace Lifebits.Api.DTOs.GeoJson
{
    public class GeoJsonFeatureCollectionDto
    {
        public string Type { get; set; } = "FeatureCollection";

        public List<GeoJsonFeatureDto> Features { get; set; } = [];
    }
}
