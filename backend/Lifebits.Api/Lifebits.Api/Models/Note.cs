namespace Lifebits.Api.Models
{
    public class Note
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;

        //public double Lng {  get; set; }
        //public double Lat { get; set; }
        public GeoJsonPoint Location { get; set; } = new();

        /// <summary>
        /// 创建时间
        /// </summary>
        public DateTime CreateAt { get; set; } = DateTime.UtcNow;

        // 用户可设置的时间
        public DateTime EventTime { get; set; }

        public int UserId { get; set; }

        public AppUser? User { get; set; }

    }
}
