using System.Collections;
using SerpApi;
using Newtonsoft.Json.Linq;

namespace GmbSaas.Backend.Services;

public class SerpApiService : ISerpApiService
{
    private readonly string _apiKey;

    public SerpApiService(IConfiguration configuration)
    {
        _apiKey = configuration["SerpApi:ApiKey"] ?? throw new InvalidOperationException("SerpApi:ApiKey is missing");
    }

    public async Task<List<ListingSearchResult>> SearchListingsAsync(string query, string location = null)
    {
         try 
        {
            Hashtable ht = new Hashtable();
            ht.Add("engine", "google_maps");
            ht.Add("type", "search");
            ht.Add("q", query);
            if (!string.IsNullOrEmpty(location))
            {
                // If it looks like a coordinate string (e.g. "@28.6...") use 'll', otherwise append to query
                if (location.StartsWith("@")) 
                {
                    ht.Add("ll", location);
                }
                else 
                {
                    ht["q"] = query + " " + location;
                }
            }
            
            return await Task.Run(() => 
            {
                GoogleSearch search = new GoogleSearch(ht, _apiKey);
                JObject data = search.GetJson();
                var results = new List<ListingSearchResult>();

                if (data["local_results"] is JArray localResults)
                {
                    foreach (JObject result in localResults)
                    {
                        try {
                            // Extract Lat/Lng
                            double lat = result["gps_coordinates"]?["latitude"]?.Value<double>() ?? 0;
                            double lng = result["gps_coordinates"]?["longitude"]?.Value<double>() ?? 0;

                            results.Add(new ListingSearchResult
                            {
                                Name = result["title"]?.ToString() ?? "",
                                Address = result["address"]?.ToString() ?? "",
                                PlaceId = result["place_id"]?.ToString() ?? "",
                                Rating = result["rating"]?.Value<double>() ?? 0,
                                ReviewCount = result["reviews"]?.Value<int>() ?? 0,
                                ThumbnailUrl = result["thumbnail"]?.ToString() ?? "",
                                WebsiteUrl = result["website"]?.ToString() ?? "",
                                Latitude = lat,
                                Longitude = lng
                            });
                        } catch (Exception ex) {
                             Console.WriteLine($"Error parsing listing: {ex.Message}");
                        }
                    }
                }
                return results;
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SerpApi Search Error: {ex.Message}");
            throw;
        }
    }

    public async Task<int> GetRankAsync(string keyword, string placeId, string location)
    {
        var result = await GetRankWithCompetitorsAsync(keyword, placeId, location);
        return result.UserRank;
    }

    public async Task<SerpResult> GetRankWithCompetitorsAsync(string keyword, string placeId, string location)
    {
         try 
        {
            Hashtable ht = new Hashtable();
            ht.Add("engine", "google_maps");
            ht.Add("type", "search");
            ht.Add("q", keyword);
            ht.Add("ll", location);
            
            // Reusing the logic above
            return await Task.Run(() => 
            {
                GoogleSearch search = new GoogleSearch(ht, _apiKey);
                JObject data = search.GetJson();
                
                var serpResult = new SerpResult();
                
                 if (data["local_results"] is JArray localResults)
                {
                    foreach (JObject result in localResults)
                    {
                        var rank = result["position"]?.Value<int>() ?? 0;
                        var name = result["title"]?.ToString() ?? "";
                        var pid = result["place_id"]?.ToString() ?? "";
                        
                        serpResult.Competitors.Add(new SerpCompetitor
                        {
                             Rank = rank,
                             Name = name,
                             PlaceId = pid
                        });

                        if (pid == placeId)
                        {
                            serpResult.UserRank = rank;
                        }
                    }
                }
                return serpResult;
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SerpApi Error: {ex.Message}");
            throw;
        }
    }

    public async Task<Dictionary<string, SerpResult>> GetGeoGridRankAsync(string keyword, string placeId, double lat, double lng, int radiusKm, int gridSize)
    {
        // 1. Generate Grid Points
        var points = GenerateGridPoints(lat, lng, radiusKm, gridSize);
        var results = new Dictionary<string, SerpResult>();

        // Using a semaphore to limit concurrency
        using var semaphore = new SemaphoreSlim(3); 
        var tasks = points.Select(async point => 
        {
            await semaphore.WaitAsync();
            try
            {
                // Construct location string for API: "@lat,lng,15z"
                string locationParam = $"@{point.Lat},{point.Lng},15z";
                var result = await GetRankWithCompetitorsAsync(keyword, placeId, locationParam);
                
                lock (results)
                {
                    results.Add($"{point.Lat},{point.Lng}", result);
                }
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(tasks);
        return results;
    }

    public async Task<List<ReviewResult>> GetReviewsAsync(string placeId)
    {
         try 
        {
            Hashtable ht = new Hashtable();
            ht.Add("engine", "google_maps_reviews");
            ht.Add("place_id", placeId);
            ht.Add("hl", "en"); 
            ht.Add("sort_by", "newestFirst"); // reasonable default
            
            return await Task.Run(() => 
            {
                GoogleSearch search = new GoogleSearch(ht, _apiKey);
                JObject data = search.GetJson();
                
                var results = new List<ReviewResult>();
                if (data["reviews"] is JArray reviews)
                {
                    foreach (JObject r in reviews)
                    {
                        var updatedResult = new ReviewResult();
                        updatedResult.Author = r["user"]?["name"]?.ToString() ?? "Anonymous";
                        updatedResult.ProfilePhotoUrl = r["user"]?["thumbnail"]?.ToString() ?? "";
                        updatedResult.Rating = r["rating"]?.Value<double>() ?? 0;
                        updatedResult.Text = r["snippet"]?.ToString() ?? "";
                        updatedResult.Date = r["date"]?.ToString() ?? "";
                        updatedResult.Link = r["link"]?.ToString() ?? "";
                        
                        if (r["response"] != null && r["response"]["snippet"] != null)
                        {
                            updatedResult.Response = r["response"]["snippet"]?.ToString();
                        }
                        
                        results.Add(updatedResult);
                    }
                }
                return results;
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"SerpApi Reviews Error: {ex.Message}");
            return new List<ReviewResult>();
        }
    }
    private List<(double Lat, double Lng)> GenerateGridPoints(double centerLat, double centerLng, int radiusKm, int gridSize)
    {
        var points = new List<(double Lat, double Lng)>();
        double stepLat = (double)radiusKm / 111.0 / (gridSize / 2.0); 
        double stepLng = (double)radiusKm / (111.0 * Math.Cos(centerLat * Math.PI / 180.0)) / (gridSize / 2.0);

        int halfGrid = gridSize / 2;
        for (int x = -halfGrid; x <= halfGrid; x++)
        {
            for (int y = -halfGrid; y <= halfGrid; y++)
            {
                points.Add((centerLat + (x * stepLat), centerLng + (y * stepLng)));
            }
        }
        return points;
    }
}
