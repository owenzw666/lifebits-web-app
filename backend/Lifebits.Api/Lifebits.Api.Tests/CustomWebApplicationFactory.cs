using Lifebits.Api.Data;
using Lifebits.Api.Models;
using Lifebits.Api.Services.PhotoStorage;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Lifebits.Api.Tests;

public sealed class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databasePath =
        Path.Combine(Path.GetTempPath(), $"lifebits-tests-{Guid.NewGuid():N}.db");

    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.UseEnvironment("Development");

        builder.ConfigureAppConfiguration((_, configurationBuilder) =>
        {
            var settings = new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = $"Data Source={_databasePath}",
                ["Database:ApplyMigrationsOnStartup"] = "true",
                ["DatabaseBackup:Enabled"] = "false",
                ["Jwt:Key"] = "integration-test-jwt-key-with-at-least-32-bytes",
                ["Jwt:Issuer"] = "Lifebits",
                ["Jwt:Audience"] = "LifebitsUsers",
                ["Jwt:AccessTokenLifetimeMinutes"] = "15",
                ["Jwt:RefreshTokenLifetimeDays"] = "30",
                ["Jwt:RefreshCookieSameSite"] = "Lax",
                ["Cors:AllowedOrigins:0"] = "http://localhost",
                ["Frontend:BaseUrl"] = "http://localhost",
                ["Email:Provider"] = "Development",
                ["GoogleAuth:ClientId"] = "test-google-client-id",
                ["PhotoStorage:Provider"] = "Local"
            };

            configurationBuilder.AddInMemoryCollection(settings);
        });

        builder.ConfigureServices(services =>
        {
            // Integration tests use a tiny test-only authentication scheme.
            // That lets Places API tests focus on place/note behavior instead of JWT setup.
            services
                .AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                    options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName,
                    _ => { });

            // Tests do not need the real filesystem or Azure storage provider.
            // A fake storage service keeps the API fast and deterministic.
            services.RemoveAll<IPhotoStorage>();
            services.AddSingleton<IPhotoStorage, InMemoryPhotoStorage>();
        });

        return base.CreateHost(builder);
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (!disposing)
        {
            return;
        }

        foreach (var suffix in new[] { string.Empty, "-wal", "-shm" })
        {
            var path = _databasePath + suffix;

            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }

    public async Task<int> CountPlacesAsync(int userId)
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        return await dbContext.Places.CountAsync(place => place.UserId == userId);
    }

    public async Task<int> CreateUserAsync(string email)
    {
        using var scope = Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var uniqueEmail = $"{Path.GetFileNameWithoutExtension(email)}-{Guid.NewGuid():N}@lifebits.test";

        var user = new AppUser
        {
            // Each test gets a unique email so repeated runs cannot hit the user email index.
            Email = uniqueEmail,
            AuthProvider = "Local",
            IsEmailVerified = true
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return user.Id;
    }
}
