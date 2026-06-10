using Lifebits.Api.Data;
using Lifebits.Api.Services.Accounts;
using Lifebits.Api.Services.Email;
using Lifebits.Api.Services.PhotoStorage;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
var jwtKey = GetRequiredConfig("Jwt:Key");
var jwtIssuer = GetRequiredConfig("Jwt:Issuer");
var jwtAudience = GetRequiredConfig("Jwt:Audience");
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=lifebits.db";
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .GetChildren()
    .Select(origin => origin.Value?.Trim())
    .Where(origin => !string.IsNullOrWhiteSpace(origin))
    .Select(origin => origin!)
    .ToArray();

if (allowedOrigins.Length == 0)
{
    throw new InvalidOperationException("Missing Cors:AllowedOrigins configuration.");
}

// Add the JWT service.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            )
        };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var userIdValue = context.Principal?
                    .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?
                    .Value;
                var tokenVersionValue = context.Principal?
                    .FindFirst("token_version")?
                    .Value;

                if (!int.TryParse(userIdValue, out var userId) ||
                    !int.TryParse(tokenVersionValue, out var tokenVersion))
                {
                    context.Fail("Invalid token claims.");
                    return;
                }

                var dbContext = context.HttpContext.RequestServices
                    .GetRequiredService<AppDbContext>();
                var currentUser = await dbContext.Users
                    .AsNoTracking()
                    .Where(user => user.Id == userId)
                    .Select(user => new
                    {
                        user.TokenVersion,
                        user.IsEmailVerified
                    })
                    .FirstOrDefaultAsync(context.HttpContext.RequestAborted);

                if (currentUser == null ||
                    currentUser.TokenVersion != tokenVersion ||
                    !currentUser.IsEmailVerified)
                {
                    context.Fail("This session is no longer valid.");
                }
            }
        };
    });

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IPhotoStorage, LocalPhotoStorage>();
builder.Services.AddScoped<IAccountTokenService, AccountTokenService>();

var emailProvider = builder.Configuration["Email:Provider"] ?? "Smtp";

if (string.Equals(emailProvider, "Development", StringComparison.OrdinalIgnoreCase))
{
    if (!builder.Environment.IsDevelopment())
    {
        throw new InvalidOperationException(
            "The Development email provider can only be used locally.");
    }

    builder.Services.AddSingleton<IAccountEmailSender, DevelopmentAccountEmailSender>();
}
else if (string.Equals(emailProvider, "Smtp", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<IAccountEmailSender, SmtpAccountEmailSender>();
}
else
{
    throw new InvalidOperationException(
        $"Unsupported Email:Provider value: {emailProvider}");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // Partition limits by IP so one client cannot exhaust the allowance for everyone.
    options.AddPolicy("authentication", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientKey(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("geocoding", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientKey(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("photo-upload", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            GetClientKey(context),
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
       policy =>
       {
           policy.WithOrigins(allowedOrigins)
                 .AllowAnyHeader()
                 .AllowAnyMethod()
                 .AllowCredentials();
       });
});

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "Lifebits API", Version = "v1" });

    // Add JWT support for Swagger.
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Please input JWT token. Format: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.Use(async (context, next) =>
{
    context.Response.Headers.XContentTypeOptions = "nosniff";
    context.Response.Headers.XFrameOptions = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    await next();
});

app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();

// Azure App Service can use this endpoint for health checks.
// It is intentionally public and does not expose database or user data.
app.MapGet("/health", () => Results.Ok(new
{
    status = "Healthy",
    service = "Lifebits.Api",
    checkedAt = DateTime.UtcNow
}));

app.MapControllers();

app.Run();

string GetRequiredConfig(string key)
{
    var value = builder.Configuration[key];

    if (string.IsNullOrWhiteSpace(value))
    {
        throw new InvalidOperationException($"Missing required configuration value: {key}");
    }

    return value;
}

static string GetClientKey(HttpContext context)
{
    return context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? context.Connection.RemoteIpAddress?.ToString()
        ?? "unknown";
}
