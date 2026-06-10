using Lifebits.Api.Data;
using Lifebits.Api.DTOs;
using Lifebits.Api.DTOs.GeoJson;
using Lifebits.Api.Models;
using Lifebits.Api.Services.PhotoStorage;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
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
        private readonly IPhotoStorage _photoStorage;
        private const int MaxPhotosPerNote = 5;
        private const long MaxPhotoSizeBytes = 8 * 1024 * 1024;
        private static readonly Dictionary<string, string> SupportedPhotoTypes =
            new(StringComparer.OrdinalIgnoreCase)
            {
                ["image/jpeg"] = ".jpg",
                ["image/png"] = ".png",
                ["image/webp"] = ".webp"
            };

        public PlacesController(
            AppDbContext context,
            IConfiguration config,
            IHttpClientFactory httpClientFactory,
            IPhotoStorage photoStorage)
        {
            _context = context;
            _config = config;
            _httpClientFactory = httpClientFactory;
            _photoStorage = photoStorage;
        }

        [Authorize]
        [HttpGet("reverse-geocode")]
        [EnableRateLimiting("geocoding")]
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
        [HttpGet("search")]
        [EnableRateLimiting("geocoding")]
        public async Task<IActionResult> SearchPlaces(
            [FromQuery] string query,
            [FromQuery] double? lng,
            [FromQuery] double? lat)
        {
            var normalizedQuery = query?.Trim();

            if (string.IsNullOrWhiteSpace(normalizedQuery) || normalizedQuery.Length < 2)
            {
                return BadRequest("Enter at least 2 characters");
            }

            if (normalizedQuery.Length > 200)
            {
                return BadRequest("Search query is too long");
            }

            var hasSearchBias = lng.HasValue && lat.HasValue;

            if (hasSearchBias && !IsValidCoordinate(lng!.Value, lat!.Value))
            {
                return BadRequest("Invalid map center coordinates");
            }

            // Keep the provider-specific response formats inside the backend.
            // The frontend always receives the same small, stable result model.
            var results = await TrySearchWithAzureMaps(
                normalizedQuery,
                hasSearchBias ? lng : null,
                hasSearchBias ? lat : null);

            if (results.Count == 0)
            {
                results = await TrySearchWithNominatim(
                    normalizedQuery,
                    hasSearchBias ? lng : null,
                    hasSearchBias ? lat : null);
            }

            if (hasSearchBias)
            {
                results = PrioritizeNearbyResults(results, lng!.Value, lat!.Value);
            }

            return Ok(results);
        }

        [Authorize]
        [HttpGet("map")]
        public async Task<IActionResult> GetPlaces()
        {
            int userId = GetUserId();

            var places = await _context.Places
                .AsNoTracking()
                .Include(p => p.Notes)
                .ThenInclude(note => note.Photos)
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
                                EventTime = n.EventTime,
                                Photos = n.Photos
                                    .OrderBy(photo => photo.CreatedAt)
                                    .Select(photo => ToPhotoDto(photo))
                                    .ToList()
                            })
                            .ToList()
                    }
                }).ToList()
            };

            return Ok(featureCollection);
        }

        [Authorize]
        [HttpGet("timeline")]
        public async Task<IActionResult> GetTimeline(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            int userId = GetUserId();
            var normalizedPage = Math.Max(page, 1);
            var normalizedPageSize = Math.Clamp(pageSize, 1, 50);

            // Query notes directly so the timeline stays efficient as the user's
            // history grows. Place data is projected without loading full entities.
            var query = _context.Notes
                .AsNoTracking()
                .Where(note => note.UserId == userId);

            var totalCount = await query.CountAsync();
            var notes = await query
                .OrderByDescending(note => note.EventTime)
                .ThenByDescending(note => note.Id)
                .Skip((normalizedPage - 1) * normalizedPageSize)
                .Take(normalizedPageSize)
                .Select(note => new TimelineItemDto
                {
                    NoteId = note.Id,
                    PlaceId = note.PlaceId,
                    PlaceName = note.Place.Name,
                    Title = note.Title,
                    Content = note.Content,
                    Category = note.Category,
                    EventTime = note.EventTime,
                    Coordinates = note.Place.Location.Coordinates,
                    Photos = note.Photos
                        .OrderBy(photo => photo.CreatedAt)
                        .Select(photo => new NotePhotoDto
                        {
                            Id = photo.Id,
                            FileName = photo.FileName,
                            ContentType = photo.ContentType,
                            SizeBytes = photo.SizeBytes,
                            CreatedAt = photo.CreatedAt
                        })
                        .ToList()
                })
                .ToListAsync();

            return Ok(new TimelinePageDto
            {
                Items = notes,
                Page = normalizedPage,
                PageSize = normalizedPageSize,
                TotalCount = totalCount,
                HasMore = normalizedPage * normalizedPageSize < totalCount
            });
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreatePlaceWithNote(CreatePlaceWithNoteDto dto)
        {
            int userId = GetUserId();

            if (string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest("Content is required");
            }

            if (dto.EventTime == default)
            {
                return BadRequest("Event time is required");
            }

            var place = new Place
            {
                Name = string.IsNullOrWhiteSpace(dto.Name) ? null : dto.Name.Trim(),
                Location = new GeoJsonPoint
                {
                    Type = "Point",
                    Coordinates = dto.Location.Coordinates
                },
                UserId = userId,

                // Notes can be added when creating the place.
                // This makes "click empty map -> create place + note" one backend action.
                Notes = new List<Note>
                {
                    new Note
                    {
                        Title = dto.Title.Trim(),
                        Content = dto.Content.Trim(),
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

            if (string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest("Content is required");
            }

            if (dto.EventTime == default)
            {
                return BadRequest("Event time is required");
            }

            // Always check UserId with PlaceId so one user cannot add notes to another user's place.
            var place = await _context.Places
                .FirstOrDefaultAsync(p => p.Id == placeId && p.UserId == userId);

            if (place == null)
            {
                return NotFound();
            }

            var note = new Note
            {
                Title = dto.Title.Trim(),
                Content = dto.Content.Trim(),
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
        [HttpPost("{placeId}/notes/{noteId}/photos")]
        [RequestSizeLimit(MaxPhotoSizeBytes + 1024 * 1024)]
        [EnableRateLimiting("photo-upload")]
        public async Task<IActionResult> UploadNotePhoto(
            int placeId,
            int noteId,
            IFormFile file,
            CancellationToken cancellationToken)
        {
            int userId = GetUserId();

            var note = await _context.Notes
                .Include(item => item.Photos)
                .FirstOrDefaultAsync(item =>
                    item.Id == noteId &&
                    item.PlaceId == placeId &&
                    item.UserId == userId,
                    cancellationToken);

            if (note == null)
            {
                return NotFound("No note found");
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("Choose a photo to upload");
            }

            if (file.Length > MaxPhotoSizeBytes)
            {
                return BadRequest("Photo must be 8 MB or smaller");
            }

            if (!SupportedPhotoTypes.TryGetValue(file.ContentType, out var extension))
            {
                return BadRequest("Only JPEG, PNG, and WebP photos are supported");
            }

            await using var input = file.OpenReadStream();

            if (!await HasValidPhotoSignature(input, extension, cancellationToken))
            {
                return BadRequest("The uploaded file does not match its image type");
            }

            if (note.Photos.Count >= MaxPhotosPerNote)
            {
                return BadRequest($"A note can contain up to {MaxPhotosPerNote} photos");
            }

            var storageKey = await _photoStorage.SaveAsync(
                input,
                extension,
                cancellationToken);
            var safeFileName = Path.GetFileName(file.FileName);

            var photo = new NotePhoto
            {
                StorageKey = storageKey,
                FileName = safeFileName.Length <= 255
                    ? safeFileName
                    : safeFileName[..255],
                ContentType = file.ContentType,
                SizeBytes = file.Length,
                NoteId = note.Id
            };

            try
            {
                _context.NotePhotos.Add(photo);
                await _context.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                await _photoStorage.DeleteAsync(storageKey, cancellationToken);
                throw;
            }

            return Ok(ToPhotoDto(photo));
        }

        [Authorize]
        [HttpGet("{placeId}/notes/{noteId}/photos/{photoId}/content")]
        public async Task<IActionResult> GetNotePhotoContent(
            int placeId,
            int noteId,
            int photoId,
            CancellationToken cancellationToken)
        {
            int userId = GetUserId();

            var photo = await _context.NotePhotos
                .AsNoTracking()
                .FirstOrDefaultAsync(item =>
                    item.Id == photoId &&
                    item.NoteId == noteId &&
                    item.Note.PlaceId == placeId &&
                    item.Note.UserId == userId,
                    cancellationToken);

            if (photo == null)
            {
                return NotFound();
            }

            var content = await _photoStorage.OpenReadAsync(
                photo.StorageKey,
                cancellationToken);

            return content == null
                ? NotFound()
                : File(content, photo.ContentType);
        }

        [Authorize]
        [HttpDelete("{placeId}/notes/{noteId}/photos/{photoId}")]
        public async Task<IActionResult> DeleteNotePhoto(
            int placeId,
            int noteId,
            int photoId,
            CancellationToken cancellationToken)
        {
            int userId = GetUserId();

            var photo = await _context.NotePhotos
                .FirstOrDefaultAsync(item =>
                    item.Id == photoId &&
                    item.NoteId == noteId &&
                    item.Note.PlaceId == placeId &&
                    item.Note.UserId == userId,
                    cancellationToken);

            if (photo == null)
            {
                return NotFound();
            }

            _context.NotePhotos.Remove(photo);
            await _context.SaveChangesAsync(cancellationToken);
            await _photoStorage.DeleteAsync(photo.StorageKey, cancellationToken);

            return NoContent();
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

            if (string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest("Content is required");
            }

            if (dto.EventTime == default)
            {
                return BadRequest("Event time is required");
            }

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

            note.Title = dto.Title.Trim();
            note.Content = dto.Content.Trim();
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

            // Read storage keys directly before the cascade delete removes the photo records.
            // This avoids relying on navigation collections being loaded on the Place entity.
            var photoStorageKeys = await _context.NotePhotos
                .Where(photo =>
                    photo.Note.PlaceId == placeId &&
                    photo.Note.UserId == userId)
                .Select(photo => photo.StorageKey)
                .ToListAsync();

            _context.Places.Remove(place);
            await _context.SaveChangesAsync();
            await DeleteStoredPhotos(photoStorageKeys);

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
                .ThenInclude(note => note.Photos)
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
            var photoStorageKeys = note.Photos
                .Select(photo => photo.StorageKey)
                .ToList();
            place.Notes.Remove(note);

            // If this was the last note, remove the empty place too.
            if (place.Notes.Count == 0)
            {
                _context.Places.Remove(place);
            }

            await _context.SaveChangesAsync();
            await DeleteStoredPhotos(photoStorageKeys);

            return Ok();
        }


        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId!);
        }

        private static NotePhotoDto ToPhotoDto(NotePhoto photo)
        {
            return new NotePhotoDto
            {
                Id = photo.Id,
                FileName = photo.FileName,
                ContentType = photo.ContentType,
                SizeBytes = photo.SizeBytes,
                CreatedAt = photo.CreatedAt
            };
        }

        private static async Task<bool> HasValidPhotoSignature(
            Stream stream,
            string extension,
            CancellationToken cancellationToken)
        {
            if (!stream.CanSeek)
            {
                return false;
            }

            var header = new byte[12];
            var bytesRead = 0;

            while (bytesRead < header.Length)
            {
                var read = await stream.ReadAsync(
                    header.AsMemory(bytesRead, header.Length - bytesRead),
                    cancellationToken);

                if (read == 0)
                {
                    break;
                }

                bytesRead += read;
            }

            stream.Position = 0;

            return extension switch
            {
                ".jpg" => bytesRead >= 3 &&
                    header[0] == 0xFF &&
                    header[1] == 0xD8 &&
                    header[2] == 0xFF,
                ".png" => bytesRead >= 8 &&
                    header.AsSpan(0, 8).SequenceEqual(
                        new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
                ".webp" => bytesRead >= 12 &&
                    header.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                    header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
                _ => false
            };
        }

        private async Task DeleteStoredPhotos(IEnumerable<string> storageKeys)
        {
            foreach (var storageKey in storageKeys)
            {
                await _photoStorage.DeleteAsync(storageKey, HttpContext.RequestAborted);
            }
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

        private async Task<List<PlaceSearchResultDto>> TrySearchWithAzureMaps(
            string query,
            double? longitude,
            double? latitude)
        {
            var subscriptionKey = _config["AzureMaps:SubscriptionKey"];

            if (string.IsNullOrWhiteSpace(subscriptionKey))
            {
                return new List<PlaceSearchResultDto>();
            }

            var endpoint = _config["AzureMaps:Endpoint"] ?? "https://atlas.microsoft.com";
            var url =
                $"{endpoint.TrimEnd('/')}/geocode" +
                $"?api-version=2026-01-01&top=5&view=Auto&query={Uri.EscapeDataString(query)}";

            if (longitude.HasValue && latitude.HasValue)
            {
                // Coordinates influence result ranking without excluding global matches.
                url += $"&coordinates={longitude.Value.ToString(System.Globalization.CultureInfo.InvariantCulture)}" +
                    $",{latitude.Value.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
            }

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Add("subscription-key", subscriptionKey);
            request.Headers.Add("Accept-Language", "en-NZ");

            try
            {
                var client = _httpClientFactory.CreateClient();
                var response = await client.SendAsync(request);

                if (!response.IsSuccessStatusCode)
                {
                    return new List<PlaceSearchResultDto>();
                }

                await using var stream = await response.Content.ReadAsStreamAsync();
                using var json = await JsonDocument.ParseAsync(stream);

                return ExtractAzureMapsSearchResults(json.RootElement);
            }
            catch
            {
                return new List<PlaceSearchResultDto>();
            }
        }

        private async Task<List<PlaceSearchResultDto>> TrySearchWithNominatim(
            string query,
            double? longitude,
            double? latitude)
        {
            var endpoint = _config["Nominatim:Endpoint"] ?? "https://nominatim.openstreetmap.org";
            var userAgent = _config["Nominatim:UserAgent"];

            if (string.IsNullOrWhiteSpace(userAgent))
            {
                return new List<PlaceSearchResultDto>();
            }

            var email = _config["Nominatim:Email"];
            var url =
                $"{endpoint.TrimEnd('/')}/search" +
                $"?format=jsonv2&limit=5&dedupe=1&addressdetails=1" +
                $"&accept-language=en-NZ&q={Uri.EscapeDataString(query)}";

            if (longitude.HasValue && latitude.HasValue)
            {
                // A viewbox is a ranking preference while bounded=0 keeps worldwide search available.
                const double longitudeRadius = 0.6;
                const double latitudeRadius = 0.4;
                var left = Math.Max(-180, longitude.Value - longitudeRadius);
                var right = Math.Min(180, longitude.Value + longitudeRadius);
                var top = Math.Min(90, latitude.Value + latitudeRadius);
                var bottom = Math.Max(-90, latitude.Value - latitudeRadius);
                var culture = System.Globalization.CultureInfo.InvariantCulture;

                url += $"&viewbox={left.ToString(culture)},{top.ToString(culture)}" +
                    $",{right.ToString(culture)},{bottom.ToString(culture)}&bounded=0";
            }

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
                    return new List<PlaceSearchResultDto>();
                }

                await using var stream = await response.Content.ReadAsStreamAsync();
                using var json = await JsonDocument.ParseAsync(stream);

                return ExtractNominatimSearchResults(json.RootElement);
            }
            catch
            {
                return new List<PlaceSearchResultDto>();
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
            return GetNominatimPreferredName(root) ?? GetString(root, "display_name");
        }

        private static List<PlaceSearchResultDto> ExtractAzureMapsSearchResults(JsonElement root)
        {
            var results = new List<PlaceSearchResultDto>();

            if (!root.TryGetProperty("features", out var features) ||
                features.ValueKind != JsonValueKind.Array)
            {
                return results;
            }

            foreach (var feature in features.EnumerateArray())
            {
                if (!TryGetPointCoordinates(feature, out var longitude, out var latitude) ||
                    !feature.TryGetProperty("properties", out var properties) ||
                    !properties.TryGetProperty("address", out var address))
                {
                    continue;
                }

                var displayName = GetString(address, "formattedAddress") ??
                    GetString(address, "addressLine") ??
                    GetString(address, "locality");

                if (string.IsNullOrWhiteSpace(displayName))
                {
                    continue;
                }

                results.Add(new PlaceSearchResultDto
                {
                    Name = GetString(address, "addressLine") ??
                        GetString(address, "locality") ??
                        displayName,
                    DisplayName = displayName,
                    Longitude = longitude,
                    Latitude = latitude
                });
            }

            return results;
        }

        private static List<PlaceSearchResultDto> ExtractNominatimSearchResults(JsonElement root)
        {
            var results = new List<PlaceSearchResultDto>();

            if (root.ValueKind != JsonValueKind.Array)
            {
                return results;
            }

            foreach (var item in root.EnumerateArray())
            {
                var displayName = GetString(item, "display_name");
                var longitudeText = GetString(item, "lon");
                var latitudeText = GetString(item, "lat");

                if (string.IsNullOrWhiteSpace(displayName) ||
                    !double.TryParse(
                        longitudeText,
                        System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var longitude) ||
                    !double.TryParse(
                        latitudeText,
                        System.Globalization.NumberStyles.Float,
                        System.Globalization.CultureInfo.InvariantCulture,
                        out var latitude))
                {
                    continue;
                }

                results.Add(new PlaceSearchResultDto
                {
                    Name = GetNominatimPreferredName(item) ??
                        displayName.Split(',')[0].Trim(),
                    DisplayName = displayName,
                    Longitude = longitude,
                    Latitude = latitude
                });
            }

            return results;
        }

        private static string? GetNominatimPreferredName(JsonElement item)
        {
            var rawName = GetString(item, "name");

            if (!item.TryGetProperty("address", out var address) ||
                address.ValueKind != JsonValueKind.Object)
            {
                return rawName;
            }

            // Prefer a meaningful venue or building name when Nominatim provides one.
            var namedPlace = GetString(address, "amenity") ??
                GetString(address, "tourism") ??
                GetString(address, "shop") ??
                GetString(address, "office") ??
                GetString(address, "leisure") ??
                GetString(address, "historic") ??
                GetString(address, "railway") ??
                GetString(address, "healthcare");

            if (!string.IsNullOrWhiteSpace(namedPlace))
            {
                return namedPlace;
            }

            var houseNumber = GetString(address, "house_number");
            var road = GetString(address, "road") ??
                GetString(address, "pedestrian") ??
                GetString(address, "footway");

            // Residential address results often expose only the house number as "name".
            // Combining it with the road produces a useful default such as "23 High Street".
            if (!string.IsNullOrWhiteSpace(houseNumber) && !string.IsNullOrWhiteSpace(road))
            {
                return $"{houseNumber} {road}";
            }

            if (!string.IsNullOrWhiteSpace(rawName) &&
                !string.Equals(rawName, houseNumber, StringComparison.OrdinalIgnoreCase))
            {
                return rawName;
            }

            return road ??
                GetString(address, "building") ??
                GetString(address, "suburb") ??
                GetString(address, "city") ??
                GetString(address, "town") ??
                GetString(address, "village");
        }

        private static bool TryGetPointCoordinates(
            JsonElement feature,
            out double longitude,
            out double latitude)
        {
            longitude = 0;
            latitude = 0;

            if (!feature.TryGetProperty("geometry", out var geometry) ||
                !geometry.TryGetProperty("coordinates", out var coordinates) ||
                coordinates.ValueKind != JsonValueKind.Array ||
                coordinates.GetArrayLength() < 2)
            {
                return false;
            }

            return coordinates[0].TryGetDouble(out longitude) &&
                coordinates[1].TryGetDouble(out latitude) &&
                IsValidCoordinate(longitude, latitude);
        }

        private static List<PlaceSearchResultDto> PrioritizeNearbyResults(
            List<PlaceSearchResultDto> results,
            double longitude,
            double latitude)
        {
            const double nearbyRadiusInDegrees = 1.0;

            // Preserve provider relevance among distant matches, but move results from the
            // current map region to the front and order those nearby matches by distance.
            return results
                .Select((result, index) => new
                {
                    Result = result,
                    OriginalIndex = index,
                    DistanceSquared =
                        Math.Pow(result.Longitude - longitude, 2) +
                        Math.Pow(result.Latitude - latitude, 2)
                })
                .OrderBy(item =>
                    item.DistanceSquared <= nearbyRadiusInDegrees * nearbyRadiusInDegrees ? 0 : 1)
                .ThenBy(item =>
                    item.DistanceSquared <= nearbyRadiusInDegrees * nearbyRadiusInDegrees
                        ? item.DistanceSquared
                        : item.OriginalIndex)
                .Select(item => item.Result)
                .ToList();
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
