using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GmbSaas.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddExtendedListingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Categories",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Cid",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FeatureId",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsClaimed",
                table: "Listings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "LocationName",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "State",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "WorkHours",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Zip",
                table: "Listings",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Categories",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "Cid",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "FeatureId",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "IsClaimed",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "LocationName",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "State",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "WorkHours",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "Zip",
                table: "Listings");
        }
    }
}
