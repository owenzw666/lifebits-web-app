using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Lifebits.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGeoJsonLocation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Lat",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "Lng",
                table: "Notes");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Notes",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .OldAnnotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<string>(
                name: "Location_Coordinates",
                table: "Notes",
                type: "TEXT",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "Location_Type",
                table: "Notes",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Location_Coordinates",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "Location_Type",
                table: "Notes");

            migrationBuilder.AlterColumn<int>(
                name: "Id",
                table: "Notes",
                type: "INTEGER",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "INTEGER")
                .Annotation("Sqlite:Autoincrement", true);

            migrationBuilder.AddColumn<double>(
                name: "Lat",
                table: "Notes",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<double>(
                name: "Lng",
                table: "Notes",
                type: "REAL",
                nullable: false,
                defaultValue: 0.0);
        }
    }
}
