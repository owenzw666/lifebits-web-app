namespace Lifebits.Api.DTOs.GeoJson
{
    public class GeoJsonGeometryDto
    {
        public string Type { get; set; } = "Point";

        public double[] Coordinates { get; set; } = [];
    }
}
