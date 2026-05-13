using Lifebits.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Lifebits.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Note>()
                .OwnsOne(n => n.Location);
        }

        public DbSet<Note> Notes{get;set;}

        public DbSet<AppUser> Users{get;set;}
    }
}
