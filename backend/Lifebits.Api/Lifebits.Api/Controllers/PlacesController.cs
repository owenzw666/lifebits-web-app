using Lifebits.Api.Data;
using Lifebits.Api.DTOs;
using Lifebits.Api.DTOs.GeoJson;
using Lifebits.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Lifebits.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlacesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PlacesController(AppDbContext context)
        {
            _context = context;
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
    }
}
