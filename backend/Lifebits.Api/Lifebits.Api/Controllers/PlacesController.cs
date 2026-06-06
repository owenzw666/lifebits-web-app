using Lifebits.Api.Data;
using Lifebits.Api.DTOs;
using Lifebits.Api.DTOs.GeoJson;
using Lifebits.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;

namespace Lifebits.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlacesController : ControllerBase
    {
        private static readonly HashSet<string> SupportedNoteCategories = new()
        {
            "Life",
            "Work",
            "Travel",
            "Other"
        };

        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;

        public PlacesController(
            AppDbContext context,
            IConfiguration config,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _config = config;
            _httpClientFactory = httpClientFactory;
        }

        [Authorize]
        [HttpGet("reverse-geocode")]
        public async Task<IActionResult> ReverseGeocode([FromQuery] double lng, [FromQuery] double lat)
        {
            if (!IsValidCoordinate(lng, lat))
            {
                return BadRequest("Invalid coordinates");
            }

            var placeName = await TryReverseGeocodeWithAzureMaps(lng, lat) ??
                await TryReverseGeocodeWithNominatim(lng, lat);

            return Ok(new ReverseGeocodeResultDto
            {
                PlaceName = placeName
            });
        }

        [Authorize]
        [HttpGet("map")]
        public async Task<IActionResult> GetPlaces()
        {
            int userId = GetUserId();

            var places = await _context.Places
                .AsNoTracking()
                .Include(p => p.Notes)
                .Where(p => p.UserId == userId)
                .ToListAsync();

            var featureCollection = new GeoJsonFeatureCollectionDto
            {
                Features = places.Select(p => new GeoJsonFeatureDto
                {
                    Geometry = new GeoJsonGeometryDto
                    {
                        Coordinates = p.Location.Coordinates
                    },

                    Properties = new
                    {
                        PlaceId = p.Id,
                        Name = p.Name,
                        NoteCount = p.Notes.Count,

                        // Get the newest note time for marker sorting or preview display.
                        LatestEventTime = p.Notes
                            .OrderByDescending(n => n.EventTime)
                            .Select(n => (DateTime?)n.EventTime)
                            .FirstOrDefault(),

                        // Send notes under this place so the frontend can show a list popup.
                        Notes = p.Notes
                            .OrderByDescending(n => n.EventTime)
                            .Select(n => new NotePropertiesDto
                            {
                                Id = n.Id,
                                Title = n.Title,
                                Content = n.Content,
                                Category = NormalizeNoteCategory(n.Category),
                                EventTime = n.EventTime
                            })
                            .ToList()
                    }
                }).ToList()
            };

            return Ok(featureCollection);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreatePlaceWithNote(CreatePlaceWithNoteDto dto)
        {
            int userId = GetUserId();

            var place = new Place
            {
                Name = dto.Name,
                Location = dto.Location,
                UserId = userId,

                // Notes can be added when creating the place.
                // This makes "click empty map -> create place + note" one backend action.
                Notes = new List<Note>
                {
                    new Note
                    {
                        Title = dto.Title,
                        Content = dto.Content,
                        Category = NormalizeNoteCategory(dto.Category),
                        EventTime = dto.EventTime,
                        UserId = userId
                    }
                }
            };

            _context.Places.Add(place);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetPlaces),
                null,
                new
                {
                    PlaceId = place.Id,
                    NoteId = place.Notes.First().Id
                }
            );
        }

        [Authorize]
        [HttpPost("{placeId}/notes")]
        public async Task<IActionResult> CreateNoteInPlace(int placeId, CreateNoteDto dto)
        {
            int userId = GetUserId();

            // Always check UserId with PlaceId so one user cannot add notes to another user's place.
            var place = await _context.Places
                .FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId);

            if (place == null)
            {
                return NotFound();
            }

            var note = new Note
            {
                Title = dto.Title,
                Content = dto.Content,
                Category = NormalizeNoteCategory(dto.Category),
                EventTime = dto.EventTime,

                // PlaceId is the connection between this note and the existing map marker.
                PlaceId = place.Id,
                UserId = userId
            };

            _context.Notes.Add(note);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                PlaceId = place.Id,
                NoteId = note.Id
            });
        }

        [Authorize]
        [HttpPut("{placeId}")]
        public async Task<IActionResult> UpdatePlace(int placeId, UpdatePlaceDto dto)
        {
            int userId = GetUserId();

            // Include UserId in the lookup so a user can only rename their own place.
            var place = await _context.Places
                .FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId);

            if (place == null)
            {
                return NotFound("No place found");
            }

            place.Name = string.IsNullOrWhiteSpace(dto.Name)
                ? null
                : dto.Name.Trim();

            await _context.SaveChangesAsync();

            return Ok(new
            {
                PlaceId = place.Id,
                place.Name
            });
        }

        [Authorize]
        [HttpPut("{placeId}/notes/{noteId}")]
        public async Task<IActionResult> UpdateNote(int placeId, int noteId, UpdateNoteDto dto)
        {
            int userId = GetUserId();

            var place = await _context.Places
                .FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId);

            if (place == null)
            {
                return NotFound();
            }

            var note = await _context.Notes.FirstOrDefaultAsync(n =>
                n.Id == noteId &&
                n.PlaceId == placeId &&
                n.UserId == userId
            );

            if (note == null)
            {
                return NotFound();
            }

            note.Title = dto.Title;
            note.Content = dto.Content;
            note.Category = NormalizeNoteCategory(dto.Category);
            note.EventTime = dto.EventTime;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                PlaceId = place.Id,
                NoteId = note.Id
            });
        }

        [Authorize]
        [HttpDelete("{placeId}")]
        public async Task<IActionResult> DeletePlace(int placeId)
        {
            int userId = GetUserId();

            // UserId must be checked here so users can only delete their own places.
            // Notes are removed by the cascade rule configured in AppDbContext.
            var place = await _context.Places
                .FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId);

            if (place == null)
            {
                return NotFound("No place found");
            }

            _context.Places.Remove(place);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize]
        [HttpDelete("{placeId}/notes/{noteId}")]
        public async Task<IActionResult> DeleteNoteFromPlace(int placeId, int noteId)
        {
            int userId = GetUserId();

            // Include notes so we can safely remove the note and know whether the place becomes empty.
            var place = await _context.Places
                .Include(p => p.Notes)
                .FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId);

            if (place == null)
            {
                return NotFound("No place found");
            }

            // Read from the loaded collection to keep the ownership check tied to the place.
            var note = place.Notes.FirstOrDefault(n => n.Id == noteId);
            if (note == null)
            {
                return NotFound("No note found");
            }

            // Removing from the collection tells EF Core to delete this note on SaveChanges.
            place.Notes.Remove(note);

            // If this was the last note, remove the empty place too.
            if (place.Notes.Count == 0)
            {
                _context.Places.Remove(place);
            }

            await _context.SaveChangesAsync();

            return Ok();
        }


        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId!);
        }

        private static string NormalizeNoteCategory(string? category)
        {
            // Keep the stored value predictable.
            // Unknown or empty values fall back to Life so old clients still work.
            if (string.IsNullOrWhiteSpace(category))
            {
                return "Life";
            }

            var trimmedCategory = category.Trim();

            return SupportedNoteCategories.Contains(trimmedCategory)
                ? trimmedCategory
                : "Life";
        }

        private static bool IsValidCoordinate(double lng, double lat)
        {
            return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
        }

        private async Task<string?> TryReverseGeocodeWithAzureMaps(double lng, double lat)
        {
            var subscriptionKey = _config["AzureMaps:SubscriptionKey"];

            if (string.IsNullOrWhiteSpace(subscriptionKey))
            {
                return null;
            }

            var endpoint = _config["AzureMaps:Endpoint"] ?? "https://atlas.microsoft.com";
            var url =
                $"{endpoint.TrimEnd('/')}/reverseGeocode" +
                $"?api-version=2026-01-01&coordinates={lng},{lat}&view=Auto";

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("subscription-key", subscriptionKey);
            request.Headers.Add("Accept-Language", "en-NZ");

            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                await using var stream = await response.Content.ReadAsStreamAsync();
                using var json = await JsonDocument.ParseAsync(stream);

                return ExtractAzureMapsPlaceName(json.RootElement);
            }
            catch
            {
                return null;
            }
        }

        private async Task<string?> TryReverseGeocodeWithNominatim(double lng, double lat)
        {
            var endpoint = _config["Nominatim:Endpoint"] ?? "https://nominatim.openstreetmap.org";
            var userAgent = _config["Nominatim:UserAgent"];

            if (string.IsNullOrWhiteSpace(userAgent))
            {
                return null;
            }

            var email = _config["Nominatim:Email"];
            var url =
                $"{endpoint.TrimEnd('/')}/reverse" +
                $"?format=jsonv2&lat={lat}&lon={lng}&zoom=18&addressdetails=1&accept-language=en-NZ";

            if (!string.IsNullOrWhiteSpace(email))
            {
                url += $"&email={Uri.EscapeDataString(email)}";
            }

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.UserAgent.ParseAdd(userAgent);

            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    return null;
                }

                await using var stream = await response.Content.ReadAsStreamAsync();
                using var json = await JsonDocument.ParseAsync(stream);

                return ExtractNominatimPlaceName(json.RootElement);
            }
            catch
            {
                return null;
            }
        }

        private static string? ExtractAzureMapsPlaceName(JsonElement root)
        {
            if (!root.TryGetProperty("features", out var features) ||
                features.ValueKind != JsonValueKind.Array ||
                features.GetArrayLength() == 0)
            {
                return null;
            }

            var firstFeature = features[0];

            if (!firstFeature.TryGetProperty("properties", out var properties) ||
                !properties.TryGetProperty("address", out var address))
            {
                return null;
            }

            return GetString(address, "addressLine") ??
                GetString(address, "formattedAddress") ??
                GetString(address, "locality") ??
                GetString(address, "neighborhood");
        }

        private static string? ExtractNominatimPlaceName(JsonElement root)
        {
            if (root.TryGetProperty("name", out var name) &&
                name.ValueKind == JsonValueKind.String &&
                !string.IsNullOrWhiteSpace(name.GetString()))
            {
                return name.GetString();
            }

            if (root.TryGetProperty("address", out var address))
            {
                return GetString(address, "amenity") ??
                    GetString(address, "tourism") ??
                    GetString(address, "shop") ??
                    GetString(address, "building") ??
                    GetString(address, "road") ??
                    GetString(address, "suburb") ??
                    GetString(address, "city") ??
                    GetString(address, "town") ??
                    GetString(address, "village");
            }

            return GetString(root, "display_name");
        }

        private static string? GetString(JsonElement element, string propertyName)
        {
            if (!element.TryGetProperty(propertyName, out var property) ||
                property.ValueKind != JsonValueKind.String)
            {
                return null;
            }

            var value = property.GetString();

            return string.IsNullOrWhiteSpace(value) ? null : value;
        }
    }
}
