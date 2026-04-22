using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lifebits.Api.Migrations
{
    /// <inheritdoc />
    public partial class updateLatLng : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Longitude",
                table: "Notes",
                newName: "Lng");

            migrationBuilder.RenameColumn(
                name: "Latitude",
                table: "Notes",
                newName: "Lat");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Lng",
                table: "Notes",
                newName: "Longitude");

            migrationBuilder.RenameColumn(
                name: "Lat",
                table: "Notes",
                newName: "Latitude");
        }
    }
}
