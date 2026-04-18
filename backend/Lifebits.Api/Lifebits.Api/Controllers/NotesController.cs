using Lifebits.Api.Data;
using Lifebits.Api.DTOs;
using Lifebits.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace Lifebits.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotesController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();

            var notes = await _context.Notes
                .Where(n=>n.UserId == userId)
                .ToListAsync();
            return Ok(notes);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create(CreateNoteDto dto) {

            var userId = GetUserId();

            Note note = new Note()
            {
                Title= dto.Title,
                Content= dto.Content,
                Latitude=dto.Latitude,
                Longitude=dto.Longitude,
                EventTime=dto.EventTime,
                UserId=userId
            };

            _context.Notes.Add(note);
            await _context.SaveChangesAsync();
            return Ok(CreatedAtAction(nameof(Create), new { id = note.Id }, note));
        }

        [Authorize]
        [HttpPatch("{id}")]
        public async Task<IActionResult> Update(int id, CreateNoteDto dto)
        {
            var userId = GetUserId();

            var note = await _context.Notes
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (note == null)
                return NotFound();

            if (dto.Title != null)
                note.Title = dto.Title;

            if (dto.Content != null)
                note.Content = dto.Content;

            if (dto.EventTime != null)
                note.EventTime = dto.EventTime;

            await _context.SaveChangesAsync();

            return Ok(note);
        }

        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();

            var note = await _context.Notes
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);

            if (note == null)
                return NotFound();

            _context.Notes.Remove(note);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        /// <summary>
        /// Get user Id
        /// </summary>
        /// <returns></returns>
        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId!);
        }
    }
}
