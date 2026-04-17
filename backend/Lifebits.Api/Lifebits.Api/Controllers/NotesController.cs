using Lifebits.Api.Data;
using Lifebits.Api.DTOs;
using Lifebits.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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
            var notes = await _context.Notes.ToListAsync();
            return Ok(notes);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> Create(CreateNoteDto dto) {
            Note note = new Note()
            {
                Title= dto.Title,
                Content= dto.Content,
                Latitude=dto.Latitude,
                Longitude=dto.Longitude,
                EventTime=dto.EventTime
            };
            _context.Notes.Add(note);
            await _context.SaveChangesAsync();
            return Ok(CreatedAtAction(nameof(GetAll), new { id = note.Id }, note));
        }
    }
}
