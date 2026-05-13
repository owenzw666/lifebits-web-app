namespace Lifebits.Api.DTOs.GeoJson
{
    public class GeoJsonFeatureDto
    {
        public string Type { get; set; } = "Feature";

        public GeoJsonGeometryDto Geometry { get; set; } = null!;

        public object Properties {  get; set; } = null!;
    }
}
