namespace Lifebits.Api.Models
{
    public class Note
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;

        public double longitude {  get; set; }
        public double latitude { get; set; }

        public DateTime CreateAt { get; set; } = DateTime.UtcNow;

        // ⭐ 用户可设置的时间
        public DateTime? EventTime { get; set; }

    }
}
