using System.ComponentModel.DataAnnotations;

namespace GmbSaas.Backend.Data.DTOs;

public class CreateListingDto
{
    [Required]
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    
    // New Fields
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
    public DateTime? ClientCreatedAt { get; set; }

    public string PhoneNumber { get; set; } = string.Empty;
    public bool IsClaimed { get; set; }
    public string Categories { get; set; } = string.Empty;
    public string WorkHours { get; set; } = string.Empty;
    public string Cid { get; set; } = string.Empty;
    public string FeatureId { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Zip { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
}

public class ListingDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;
    public bool IsClaimed { get; set; }
    public string Categories { get; set; } = string.Empty;
    public string WorkHours { get; set; } = string.Empty;
    public string Cid { get; set; } = string.Empty;
    public string FeatureId { get; set; } = string.Empty;
    
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Zip { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
}
