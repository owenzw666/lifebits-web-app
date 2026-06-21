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

            modelBuilder.Entity<ExternalLogin>()
                .HasIndex(login => new { login.Provider, login.ProviderUserId })
                .IsUnique();

            modelBuilder.Entity<ExternalLogin>()
                .HasIndex(login => new { login.UserId, login.Provider })
                .IsUnique();

            modelBuilder.Entity<ExternalLogin>()
                .HasOne(login => login.User)
                .WithMany(user => user.ExternalLogins)
                .HasForeignKey(login => login.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ExternalLogin>()
                .Property(login => login.Provider)
                .HasMaxLength(32);

            modelBuilder.Entity<ExternalLogin>()
                .Property(login => login.ProviderUserId)
                .HasMaxLength(128);

            modelBuilder.Entity<AccountToken>()
                .HasIndex(token => token.TokenHash)
                .IsUnique();

            modelBuilder.Entity<AccountToken>()
                .HasOne(token => token.User)
                .WithMany(user => user.AccountTokens)
                .HasForeignKey(token => token.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AccountToken>()
                .Property(token => token.Type)
                .HasMaxLength(32);

            modelBuilder.Entity<AccountToken>()
                .Property(token => token.TokenHash)
                .HasMaxLength(64);

            modelBuilder.Entity<Place>()
                .OwnsOne(p => p.Location);

            // Keep the existing SQLite autoincrement behavior explicit.
            // This prevents unrelated migrations from changing the Place primary key.
            modelBuilder.Entity<Place>()
                .Property(p => p.Id)
                .ValueGeneratedOnAdd()
                .HasAnnotation("Sqlite:Autoincrement", true);

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

            modelBuilder.Entity<NotePhoto>()
                .HasOne(photo => photo.Note)
                .WithMany(note => note.Photos)
                .HasForeignKey(photo => photo.NoteId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<NotePhoto>()
                .Property(photo => photo.StorageKey)
                .HasMaxLength(160);

            modelBuilder.Entity<NotePhoto>()
                .Property(photo => photo.FileName)
                .HasMaxLength(255);

            modelBuilder.Entity<NotePhoto>()
                .Property(photo => photo.ContentType)
                .HasMaxLength(100);
        }

        public DbSet<Place> Places { get; set; }

        public DbSet<Note> Notes{get;set;}

        public DbSet<NotePhoto> NotePhotos { get; set; }

        public DbSet<AppUser> Users{get;set;}

        public DbSet<AccountToken> AccountTokens { get; set; }

        public DbSet<ExternalLogin> ExternalLogins { get; set; }
    }
}
