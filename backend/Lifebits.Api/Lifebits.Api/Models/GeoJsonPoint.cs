namespace Lifebits.Api.Models
{
    public class GeoJsonPoint
    {
        public string Type { get; set; } = "Point";

        // GeoJSON 标准：
        // [longitude, latitude]
        public double[] Coordinates { get; set; } = [];
    }
}
