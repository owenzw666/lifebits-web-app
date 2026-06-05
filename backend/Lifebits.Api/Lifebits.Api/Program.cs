using Lifebits.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

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
    });

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
//builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
       policy =>
       {
           policy.WithOrigins(allowedOrigins)
                 .AllowAnyHeader()
                 .AllowAnyMethod();
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

app.UseHttpsRedirection();

//Enable the authentication middleware
app.UseCors("AllowReactApp");
app.UseAuthentication();
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
