using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lifebits.Api.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeNoteModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "longitude",
                table: "Notes",
                newName: "Longitude");

            migrationBuilder.RenameColumn(
                name: "latitude",
                table: "Notes",
                newName: "Latitude");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Longitude",
                table: "Notes",
                newName: "longitude");

            migrationBuilder.RenameColumn(
                name: "Latitude",
                table: "Notes",
                newName: "latitude");
        }
    }
}
