using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GmbSaas.Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserLimits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxListings",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "OwnerId",
                table: "Listings",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Listings_OwnerId",
                table: "Listings",
                column: "OwnerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Listings_Users_OwnerId",
                table: "Listings",
                column: "OwnerId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Listings_Users_OwnerId",
                table: "Listings");

            migrationBuilder.DropIndex(
                name: "IX_Listings_OwnerId",
                table: "Listings");

            migrationBuilder.DropColumn(
                name: "MaxListings",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "OwnerId",
                table: "Listings");
        }
    }
}
