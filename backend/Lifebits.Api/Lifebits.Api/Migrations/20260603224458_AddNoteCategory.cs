using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lifebits.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddNoteCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Notes",
                type: "TEXT",
                maxLength: 32,
                nullable: false,
                defaultValue: "Life");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Notes");
        }
    }
}
