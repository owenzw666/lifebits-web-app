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
            modelBuilder.Entity<Place>()
                .OwnsOne(p => p.Location);

            modelBuilder.Entity<Place>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Note>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Note>()
                .HasOne(n => n.Place)
                .WithMany(p => p.Notes)
                .HasForeignKey(n => n.PlaceId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        public DbSet<Place> Places { get; set; }

        public DbSet<Note> Notes{get;set;}

        public DbSet<AppUser> Users{get;set;}
    }
}
