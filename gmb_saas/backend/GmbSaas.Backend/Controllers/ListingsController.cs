using GmbSaas.Backend.Data;
using GmbSaas.Backend.Data.DTOs;
using GmbSaas.Backend.Data.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Text; // Added

namespace GmbSaas.Backend.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ListingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ListingsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ListingDto>>> GetListings()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var listings = await _context.Listings
            .Where(l => l.OwnerId == uid)
            .Select(l => new ListingDto
            {
                Id = l.Id,
                Name = l.Name,
                Address = l.Address,
                PlaceId = l.PlaceId,
                WebsiteUrl = l.WebsiteUrl,
                CreatedAt = l.CreatedAt,
                Latitude = l.Latitude,
                Longitude = l.Longitude,
                Rating = l.Rating,
                ReviewCount = l.ReviewCount,
                ThumbnailUrl = l.ThumbnailUrl
            })
            .ToListAsync();

        return Ok(listings);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ListingDto>> GetListing(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var listing = await _context.Listings.FirstOrDefaultAsync(l => l.Id == id && l.OwnerId == uid);

        if (listing == null)
        {
            return NotFound();
        }

        return new ListingDto
        {
            Id = listing.Id,
            Name = listing.Name,
            Address = listing.Address,
            PlaceId = listing.PlaceId,
            WebsiteUrl = listing.WebsiteUrl,
            CreatedAt = listing.CreatedAt,
            Latitude = listing.Latitude,
            Longitude = listing.Longitude,
            Rating = listing.Rating,
            ReviewCount = listing.ReviewCount,
            ThumbnailUrl = listing.ThumbnailUrl
        };
    }

    [HttpPost]
    public async Task<ActionResult<ListingDto>> CreateListing(CreateListingDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var user = await _context.Users.FindAsync(uid);
        if (user == null) return Unauthorized();

        // Check Limits
        var currentCount = await _context.Listings.CountAsync(l => l.OwnerId == uid);
        if (currentCount >= user.MaxListings)
        {
            return StatusCode(403, $"Limit reached. Your tier allows {user.MaxListings} listing(s). Please upgrade to add more.");
        }

        var listing = new Listing
        {
            OwnerId = uid,
            Name = dto.Name,
            Address = dto.Address,
            PlaceId = dto.PlaceId,
            WebsiteUrl = dto.WebsiteUrl,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Rating = dto.Rating,
            ReviewCount = dto.ReviewCount,
            ThumbnailUrl = dto.ThumbnailUrl,
            CreatedAt = dto.ClientCreatedAt ?? DateTime.UtcNow
        };

        _context.Listings.Add(listing);
        await _context.SaveChangesAsync();

        var createdDto = new ListingDto
        {
            Id = listing.Id,
            Name = listing.Name,
            Address = listing.Address,
            PlaceId = listing.PlaceId,
            WebsiteUrl = listing.WebsiteUrl,
            CreatedAt = listing.CreatedAt
        };

        return CreatedAtAction(nameof(GetListings), new { id = listing.Id }, createdDto);
    }

    [HttpPost("{id}/keywords")]
    public async Task<ActionResult<KeywordDto>> AddKeyword(Guid id, [FromBody] CreateKeywordDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var listing = await _context.Listings.FindAsync(id);
        if (listing == null) return NotFound();
        if (listing.OwnerId != uid) return Forbid();

        var user = await _context.Users.FindAsync(uid);
        if (user == null) return Unauthorized();

        // Check Keyword Limits (Global count for user)
        var currentKeywordCount = await _context.Keywords.Include(k => k.Listing).CountAsync(k => k.Listing.OwnerId == uid);
        if (currentKeywordCount >= user.MaxKeywords)
        {
             return StatusCode(403, $"Keyword limit reached. Your tier allows {user.MaxKeywords} keywords. Upgrade to add more.");
        }

        var keyword = new Keyword
        {
            ListingId = id,
            Term = dto.Term,
            Location = dto.Location
        };

        _context.Keywords.Add(keyword);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetKeywords), new { id = listing.Id }, new KeywordDto { Id = keyword.Id, Term = keyword.Term, Location = keyword.Location });
    }

    [HttpGet("{id}/keywords")]
    public async Task<ActionResult<IEnumerable<KeywordDto>>> GetKeywords(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var listing = await _context.Listings.FindAsync(id);
        if (listing == null) return NotFound();
        if (listing.OwnerId != uid) return Forbid();

        var keywords = await _context.Keywords
            .Where(k => k.ListingId == id)
            .Select(k => new KeywordDto 
            { 
                Id = k.Id, 
                Term = k.Term, 
                Location = k.Location,
                LatestRank = k.RankHistory.OrderByDescending(r => r.ScrapedAt).Select(r => r.Rank).FirstOrDefault()
            })
            .ToListAsync();

        return Ok(keywords);
    }

    [HttpDelete("keywords/{id}")]
    public async Task<ActionResult> DeleteKeyword(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var keyword = await _context.Keywords.Include(k => k.Listing).FirstOrDefaultAsync(k => k.Id == id);
        if (keyword == null) return NotFound();
        if (keyword.Listing?.OwnerId != uid) return Forbid();

        _context.Keywords.Remove(keyword);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteListing(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var listing = await _context.Listings.FindAsync(id);
        if (listing == null) return NotFound();
        if (listing.OwnerId != uid) return Forbid();

        _context.Listings.Remove(listing);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // Rank Check Endpoint
    [HttpPost("keywords/{keywordId}/check-rank")]
    public async Task<ActionResult<int>> CheckRank(Guid keywordId, [FromServices] GmbSaas.Backend.Services.ISerpApiService serpService)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var keyword = await _context.Keywords.Include(k => k.Listing).FirstOrDefaultAsync(k => k.Id == keywordId);
        if (keyword == null) return NotFound();
        if (keyword.Listing?.OwnerId != uid) return Forbid();

        var user = await _context.Users.FindAsync(uid);
        if (user == null) return Unauthorized();

        // Credit Check
        if (user.Credits < 1)
        {
            return StatusCode(402, "Insufficient credits. Please top up.");
        }

        // Use Listing's PlaceId and Keyword's Location
        var result = await serpService.GetRankWithCompetitorsAsync(keyword.Term, keyword.Listing?.PlaceId ?? "", keyword.Location);

        var history = new RankHistory
        {
            KeywordId = keywordId,
            Rank = result.UserRank,
            ScrapedAt = DateTime.UtcNow,
            UrlFound = result.UrlFound
        };

        // Add Competitors
        foreach (var comp in result.Competitors)
        {
            history.CompetitorResults.Add(new CompetitorResult
            {
                Name = comp.Name,
                PlaceId = comp.PlaceId,
                Rank = comp.Rank,
                Url = comp.Url
            });
        }

        _context.RankHistory.Add(history);
        
        // Deduct Credit
        user.Credits -= 1;
        
        await _context.SaveChangesAsync();

        return Ok(result.UserRank);
    }

    [HttpPost("geogrid")]
    public async Task<ActionResult<Dictionary<string, int>>> GetGeoGrid([FromBody] GeoGridRequestDto dto, [FromServices] GmbSaas.Backend.Services.ISerpApiService serpService)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var listing = await _context.Listings.FindAsync(dto.ListingId);
        if (listing == null) return NotFound("Listing not found");
        if (listing.OwnerId != uid) return Forbid();

        var user = await _context.Users.FindAsync(uid);
        if (user == null) return Unauthorized();

        // Calculate Cost
        int cost = dto.GridSize * dto.GridSize;
        if (user.Credits < cost)
        {
            return StatusCode(402, $"Insufficient credits. This scan requires {cost} credits.");
        }

        var results = await serpService.GetGeoGridRankAsync(
            dto.Keyword, 
            listing.PlaceId, 
            dto.CenterLat, 
            dto.CenterLng, 
            dto.RadiusKm, 
            dto.GridSize
        );

        // Save scan to DB
        var scan = new GmbSaas.Backend.Data.Entities.GeoGridScan
        {
            ListingId = listing.Id,
            Keyword = dto.Keyword,
            RadiusKm = dto.RadiusKm,
            GridSize = dto.GridSize,
            AverageRank = results.Count > 0 ? results.Values.Average(r => r.UserRank) : 0,
            CreatedAt = DateTime.UtcNow
        };
        
        _context.GeoGridScans.Add(scan);
        
        foreach(var kvp in results)
        {
            // Key is "lat,lng"
            var parts = kvp.Key.Split(',');
            if (parts.Length == 2 && double.TryParse(parts[0], out double lat) && double.TryParse(parts[1], out double lng))
            {
                var point = new GmbSaas.Backend.Data.Entities.GeoGridPoint 
                {
                    GeoGridScanId = scan.Id,
                    Latitude = lat,
                    Longitude = lng,
                    Rank = kvp.Value.UserRank
                };
                scan.Points.Add(point);
                
                // Add Competitors for this point
                foreach(var comp in kvp.Value.Competitors)
                {
                    point.Competitors.Add(new GmbSaas.Backend.Data.Entities.GeoGridCompetitor
                    {
                        Name = comp.Name,
                        PlaceId = comp.PlaceId,
                        Rank = comp.Rank
                    });
                }
            }
        }
        
        // Deduct Credits
        user.Credits -= cost;
        
        await _context.SaveChangesAsync();

        var simpleResults = results.ToDictionary(k => k.Key, v => v.Value.UserRank);
        return Ok(simpleResults);
    }

    [HttpGet("{id}/geogrid-scans")]
    public async Task<ActionResult<IEnumerable<object>>> GetGeoGridScans(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var listing = await _context.Listings.FindAsync(id);
        if (listing == null) return NotFound();
        if (listing.OwnerId != uid) return Forbid();

        var scans = await _context.GeoGridScans
            .Where(s => s.ListingId == id)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new 
            {
                s.Id,
                s.Keyword,
                s.RadiusKm,
                s.GridSize,
                s.AverageRank,
                s.CreatedAt
            })
            .ToListAsync();
            
        return Ok(scans);
    }

    [HttpGet("{id}/competitors")]
    public async Task<ActionResult<IEnumerable<CompetitorAnalysisDto>>> GetCompetitorAnalysis(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var listing = await _context.Listings.FindAsync(id);
        if (listing == null) return NotFound();
        if (listing.OwnerId != uid) return Forbid();

        // Simple analysis: Group by Keyword -> Group by Competitor -> Calculate stats
        var history = await _context.RankHistory
            .Include(rh => rh.Keyword)
            .Include(rh => rh.CompetitorResults)
            .Where(rh => rh.Keyword!.ListingId == id)
            .OrderByDescending(rh => rh.ScrapedAt)
            .Take(50) // Analyze recent 50 checks
            .ToListAsync();

        var analysis = history
            .GroupBy(h => h.Keyword!.Term)
            .Select(g => new CompetitorAnalysisDto
            {
                Keyword = g.Key,
                TopCompetitors = g.SelectMany(h => h.CompetitorResults)
                    .GroupBy(c => c.PlaceId)
                    .Select(cg => new CompetitorRankDto
                    {
                        Name = cg.First().Name,
                        PlaceId = cg.Key,
                        AppearanceCount = cg.Count(),
                        AverageRank = cg.Average(c => c.Rank),
                        BestRank = cg.Min(c => c.Rank)
                    })
                    .OrderBy(c => c.AverageRank)
                    .Take(10)
                    .ToList()
            })
            .ToList();

        return Ok(analysis);
    }



    [HttpGet("geogrid-scans/{scanId}")]
    public async Task<ActionResult> GetGeoGridScan(Guid scanId)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var scan = await _context.GeoGridScans
            .Where(s => s.Id == scanId && s.Listing != null && s.Listing.OwnerId == uid)
            .Select(s => new 
            {
                s.Id,
                s.ListingId,
                s.Keyword,
                s.RadiusKm,
                s.GridSize,
                s.AverageRank,
                s.CreatedAt,
                Points = s.Points.Select(p => new 
                {
                    p.Id,
                    p.Latitude,
                    p.Longitude,
                    p.Rank,
                    Competitors = p.Competitors.Select(c => new 
                    {
                        c.Id,
                        c.Name,
                        c.PlaceId,
                        c.Rank
                    }).OrderBy(c => c.Rank).ToList()
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (scan == null) return NotFound();

        return Ok(scan);
    }



    [HttpGet("{id}/reviews")]
    public async Task<ActionResult<List<GmbSaas.Backend.Services.ReviewResult>>> GetReviews(Guid id, [FromServices] GmbSaas.Backend.Services.ISerpApiService serpService)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();
        var uid = Guid.Parse(userId);

        var listing = await _context.Listings.FindAsync(id);
        if (listing == null) return NotFound();
        if (listing.OwnerId != uid) return Forbid();
        
        if (string.IsNullOrEmpty(listing.PlaceId))
            return BadRequest("Listing does not have a Place ID associated.");

        var reviews = await serpService.GetReviewsAsync(listing.PlaceId);
        return Ok(reviews);
    }

    [HttpGet("search")]
    public async Task<ActionResult<List<GmbSaas.Backend.Services.ListingSearchResult>>> SearchListings([FromQuery] string query, [FromQuery] string? location, [FromServices] GmbSaas.Backend.Services.ISerpApiService serpService)
    {
        if (string.IsNullOrWhiteSpace(query)) return BadRequest("Query is required");
        
        try 
        {
            var results = await serpService.SearchListingsAsync(query, location);
            return Ok(results);
        }
        catch (Exception ex)
        {
             return StatusCode(500, ex.Message);
        }
    }
    [HttpGet("locations")]
    public async Task<ActionResult> GetLocations([FromQuery] string q, [FromQuery] string country = "US", [FromServices] GmbSaas.Backend.Services.LocationService locationService = null)
    {
         if (string.IsNullOrEmpty(q)) return BadRequest("Query is required.");
         
         if (locationService != null)
         {
             var results = await locationService.SearchLocationsAsync(q, country.ToUpper());
             return Ok(results);
         }
         
         return StatusCode(500, "LocationService not available");
    }

    [HttpPost("locations/sync")]
    public async Task<ActionResult> SyncLocations([FromQuery] string country = "US", [FromServices] GmbSaas.Backend.Services.LocationService locationService = null)
    {
        if (locationService == null) return StatusCode(500, "LocationService not available");
        try
        {
            await locationService.SyncLocationsAsync(country);
            return Ok($"Locations for {country} synced successfully.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }
}
