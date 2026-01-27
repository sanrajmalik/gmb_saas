using System.ComponentModel.DataAnnotations;

namespace GmbSaas.Backend.Data.DTOs;

public class GeoGridRequestDto
{
    [Required]
    public Guid ListingId { get; set; }
    [Required]
    public string Keyword { get; set; } = string.Empty;
    [Required]
    public double CenterLat { get; set; }
    [Required]
    public double CenterLng { get; set; }
    public int RadiusKm { get; set; } = 5; // Default 5km radius
    public int GridSize { get; set; } = 3; // Default 3x3 grid
}
