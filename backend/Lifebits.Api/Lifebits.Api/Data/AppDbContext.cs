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
            modelBuilder.Entity<AppUser>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<AppUser>()
                .HasIndex(u => new { u.AuthProvider, u.ProviderUserId });

            modelBuilder.Entity<AppUser>()
                .Property(u => u.AuthProvider)
                .HasMaxLength(32)
                .HasDefaultValue("Local");

            modelBuilder.Entity<AppUser>()
                .Property(u => u.ProviderUserId)
                .HasMaxLength(128);

            modelBuilder.Entity<AppUser>()
                .Property(u => u.DisplayName)
                .HasMaxLength(120);

            modelBuilder.Entity<AppUser>()
                .Property(u => u.AvatarUrl)
                .HasMaxLength(500);

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

            modelBuilder.Entity<Note>()
                .Property(n => n.Category)
                .HasMaxLength(32)
                .HasDefaultValue("Life");
        }

        public DbSet<Place> Places { get; set; }

        public DbSet<Note> Notes{get;set;}

        public DbSet<AppUser> Users{get;set;}
    }
}
