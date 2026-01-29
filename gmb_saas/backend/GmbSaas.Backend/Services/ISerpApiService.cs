using System.Text.Json;

namespace GmbSaas.Backend.Services;

public class SerpResult
{
    public int UserRank { get; set; }
    public string UrlFound { get; set; } = string.Empty;
    public List<SerpCompetitor> Competitors { get; set; } = new();
}

public class SerpCompetitor
{
    public string Name { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty;
    public int Rank { get; set; }
    public string Url { get; set; } = string.Empty;
}

public interface ISerpApiService
{
    Task<SerpResult> GetRankWithCompetitorsAsync(string keyword, string placeId, string location);
    Task<Dictionary<string, SerpResult>> GetGeoGridRankAsync(string keyword, string placeId, string listingName, double lat, double lng, int radiusKm, int gridSize);
    // Legacy simple rank check might be deprecated or just wrap the new one
    Task<int> GetRankAsync(string keyword, string placeId, string location);
    
    // New: For Listing Wizard
    Task<List<ListingSearchResult>> SearchListingsAsync(string query, string location = null);
    
    // New: For Reviews
    Task<List<ReviewResult>> GetReviewsAsync(string placeId);
}

public class ReviewResult
{
    public string Author { get; set; } = string.Empty;
    public string ProfilePhotoUrl { get; set; } = string.Empty;
    public double Rating { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public string Response { get; set; } = string.Empty;
}

public class ListingSearchResult
{
    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    
    // Extended Data
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
