using Microsoft.AspNetCore.Mvc;
using Lifebits.Api.Data;
using Lifebits.Api.Models;

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

        [HttpGet]
        public IActionResult GetAll()
        {
            var notes = _context.Notes.ToList();
            return Ok(notes);
        }

        [HttpPost]
        public IActionResult Create(Note note) { 
            _context.Notes.Add(note);
            _context.SaveChanges();
            return Ok(note);
        }
    }
}
