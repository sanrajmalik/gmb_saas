using System.ComponentModel.DataAnnotations;

namespace GmbSaas.Backend.Data.Entities;

public class Listing
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required]
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty; // Google Place ID
    public string WebsiteUrl { get; set; } = string.Empty;
    
    // Rich Data
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Guid? OwnerId { get; set; }
    public User? Owner { get; set; }

    // Navigation properties
    public ICollection<Keyword> Keywords { get; set; } = new List<Keyword>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public class Keyword
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ListingId { get; set; }
    [Required]
    public string Term { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty; // e.g. "New York, NY" or coordinates
    public string Group { get; set; } = "General"; // e.g. "Services", "Competitors"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Listing? Listing { get; set; }
    public ICollection<RankHistory> RankHistory { get; set; } = new List<RankHistory>();
}

public class RankHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid KeywordId { get; set; }
    public int Rank { get; set; } // 0 if not found
    public DateTime ScrapedAt { get; set; } = DateTime.UtcNow;
    public string UrlFound { get; set; } = string.Empty;

    public Keyword? Keyword { get; set; }
    public ICollection<CompetitorResult> CompetitorResults { get; set; } = new List<CompetitorResult>();
}

public class Review
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ListingId { get; set; }
    public string AuthorName { get; set; } = string.Empty;
    public int Rating { get; set; } // 1-5
    public string Content { get; set; } = string.Empty;
    public DateTime PublishedAt { get; set; }
    public string? Reply { get; set; }
    
    public Listing? Listing { get; set; }
}

public class CompetitorResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RankHistoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty;
    public int Rank { get; set; }
    public string Url { get; set; } = string.Empty;
    
    public RankHistory? RankHistory { get; set; }
}

public class GeoGridScan
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ListingId { get; set; }
    public string Keyword { get; set; } = string.Empty;
    public int RadiusKm { get; set; }
    public int GridSize { get; set; } 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public double AverageRank { get; set; }
    
    public Listing? Listing { get; set; }
    public ICollection<GeoGridPoint> Points { get; set; } = new List<GeoGridPoint>();
}

public class GeoGridPoint
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GeoGridScanId { get; set; }
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public int Rank { get; set; }
    
    public GeoGridScan? Scan { get; set; }
    public ICollection<GeoGridCompetitor> Competitors { get; set; } = new List<GeoGridCompetitor>();
}

public class GeoGridCompetitor
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid GeoGridPointId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty;
    public int Rank { get; set; }

    public GeoGridPoint? Point { get; set; }
}
