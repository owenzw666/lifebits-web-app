using Lifebits.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lifebits.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<Note> Notes{get;set;}
    }
}
