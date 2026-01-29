using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Net.Http.Headers;

namespace GmbSaas.Backend.Services;

public class DataForSeoService : ISerpApiService
{
    private readonly string _login;
    private readonly string _password;
    private readonly HttpClient _httpClient;

    public DataForSeoService(IConfiguration configuration, HttpClient httpClient)
    {
        _login = configuration["DataForSeo:Login"] ?? throw new InvalidOperationException("DataForSeo:Login is missing");
        _password = configuration["DataForSeo:Password"] ?? throw new InvalidOperationException("DataForSeo:Password is missing");
        _httpClient = httpClient;
        
        var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{_login}:{_password}"));
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authToken);
        _httpClient.BaseAddress = new Uri("https://api.dataforseo.com/");
    }

    public async Task<List<ListingSearchResult>> SearchListingsAsync(string query, string location = null)
    {
        // Endpoint: v3/serp/google/maps/live/advanced
        // Body: Array of task objects
        
        // Construct the POST body
        // Note: DataForSEO location logic is strict. "location_code" or "location_name" or "location_coordinate"?
        // The interface passes `location` string which might be "@lat,lng,z" or "New York".
        // If it starts with @, we use coordinates. Else we try location_name parameter if it's a valid string.
        // However, for Maps search, `q` usually contains everything or we use specific fields.
        // User sample: "keyword":"diploma...", "location_code":... , "search_this_area": true.
        // We need to map our generic params to this.

        var taskObj = new JObject
        {
            ["keyword"] = query,
            ["language_code"] = "en",
            ["device"] = "desktop",
            ["os"] = "windows",
            ["depth"] = 20 // Fetch up to 20
        };

        if (!string.IsNullOrEmpty(location))
        {
             if (location.StartsWith("@"))
             {
                 // Format: @lat,lng,zoom
                 // DataForSEO parameter: "location_coordinate": "lat,lng,zoom" or just "lat,lng"
                 // but 'location_coordinate' expects "lat,lng". Zoom is separate? Use "location_coordinate"
                 // Remove '@'
                 var coords = location.TrimStart('@');
                 // If it has 'z' at end, remove it or keep it? DataForSeo doc says:
                 // "location_coordinate": "40.7143528,-74.0059731"
                 // we might need to strip the 'z' part if present.
                 var parts = coords.Split(',');
                 if (parts.Length >= 2)
                 {
                     taskObj["location_coordinate"] = $"{parts[0]},{parts[1]}";
                 }
             }
             else
             {
                 taskObj["location_name"] = location;
             }
        }

        var jsonBody = new JArray { taskObj };

        var content = new StringContent(jsonBody.ToString(), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("v3/serp/google/maps/live/advanced", content);
        
        if (!response.IsSuccessStatusCode)
        {
             var error = await response.Content.ReadAsStringAsync();
             Console.WriteLine($"DataForSEO Error: {response.StatusCode} - {error}");
             throw new Exception($"DataForSEO API Error: {response.StatusCode}");
        }

        var respString = await response.Content.ReadAsStringAsync();
        var respJson = JObject.Parse(respString);

        // Parse Response
        var results = new List<ListingSearchResult>();

        /*
          Response Structure:
          { tasks: [ { result: [ { items: [ ... ] } ] } ] }
        */

        var tasks = respJson["tasks"] as JArray;
        if (tasks != null && tasks.Count > 0)
        {
            var resultObj = tasks[0]["result"] as JArray;
            if (resultObj != null && resultObj.Count > 0)
            {
                var items = resultObj[0]["items"] as JArray;
                if (items != null)
                {
                    foreach (JObject item in items)
                    {
                        if (item["type"]?.ToString() != "maps_search") continue;

                        var ratingObj = item["rating"] as JObject;
                        var addressObj = item["address_info"] as JObject;

                        results.Add(new ListingSearchResult
                        {
                            Name = item["title"]?.ToString() ?? "",
                            PlaceId = item["place_id"]?.ToString() ?? "",
                            Address = item["address"]?.ToString() ?? "",
                            Rating = ratingObj?["value"]?.Value<double>() ?? 0,
                            ReviewCount = ratingObj?["votes_count"]?.Value<int>() ?? 0,
                            ThumbnailUrl = item["main_image"]?.ToString() ?? "",
                            WebsiteUrl = item["url"]?.ToString() ?? "",
                            Latitude = item["latitude"]?.Value<double>() ?? 0,
                            Longitude = item["longitude"]?.Value<double>() ?? 0,
                            
                            // Mappings
                            PhoneNumber = item["phone"]?.ToString() ?? "",
                            IsClaimed = item["is_claimed"]?.Value<bool>() ?? false,
                            Categories = JsonConvert.SerializeObject(new { 
                                category = item["category"]?.ToString(),
                                additional = item["additional_categories"] // JArray
                            }),
                            WorkHours = item["work_hours"]?.ToString() ?? "", // Store raw JSON of work_hours
                            Cid = item["cid"]?.ToString() ?? "",
                            FeatureId = item["feature_id"]?.ToString() ?? "",
                            
                            // Address Info
                            City = addressObj?["city"]?.ToString() ?? "",
                            State = addressObj?["region"]?.ToString() ?? "",
                            Zip = addressObj?["zip"]?.ToString() ?? ""
                        });
                    }
                }
            }
        }

        return results;
    }

    public async Task<SerpResult> GetRankWithCompetitorsAsync(string keyword, string placeId, string location)
    {
        // Similar to SearchListings, but we look for specific placeId rank
         var taskObj = new JObject
        {
            ["keyword"] = keyword,
            ["language_code"] = "en",
            ["depth"] = 20,
             ["search_this_area"]=true,
             ["device"]="mobile"

        };

        if (!string.IsNullOrEmpty(location))
        {

             if (location.StartsWith("@"))
             {
                  var coords = location.TrimStart('@').Split(',');
                  if (coords.Length >= 2) taskObj["location_coordinate"] = $"{coords[0]},{coords[1]},{coords[2]}";
             }
             else
             {
                 taskObj["location_name"] = location;
             }
        }

        var jsonBody = new JArray { taskObj };
        var content = new StringContent(jsonBody.ToString(), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync("v3/serp/google/maps/live/advanced", content);
        
        if (!response.IsSuccessStatusCode) throw new Exception($"DataForSeo Error: {response.StatusCode}");

        var respString = await response.Content.ReadAsStringAsync();
        var respJson = JObject.Parse(respString);

        var serpResult = new SerpResult();
        
        var tasks = respJson["tasks"] as JArray;
        if (tasks != null && tasks.Count > 0)
        {
            var resultObj = tasks[0]["result"] as JArray;
            if (resultObj != null && resultObj.Count > 0)
            {
                var items = resultObj[0]["items"] as JArray;
                if (items != null)
                {
                    foreach (JObject item in items)
                    {
                         if (item["type"]?.ToString() != "maps_search") continue;

                         var pid = item["place_id"]?.ToString() ?? "";
                         var rank = item["rank_absolute"]?.Value<int>() ?? 0;
                         var name = item["title"]?.ToString() ?? "";

                         serpResult.Competitors.Add(new SerpCompetitor
                         {
                             Rank = rank,
                             Name = name,
                             PlaceId = pid,
                             Url = item["url"]?.ToString()
                         });

                         if (pid == placeId)
                         {
                             serpResult.UserRank = rank;
                             serpResult.UrlFound = item["url"]?.ToString();
                         }
                    }
                }
            }
        }

        return serpResult;
    }

    public async Task<int> GetRankAsync(string keyword, string placeId, string location)
    {
        var res = await GetRankWithCompetitorsAsync(keyword, placeId, location);
        return res.UserRank;
    }

    public async Task<Dictionary<string, SerpResult>> GetGeoGridRankAsync(string keyword, string placeId, double lat, double lng, int radiusKm, int gridSize)
    {
         // 1. Generate Grid Points (Reused logic, copy-pasted or shared? Better to make shared util, but for now duplicate to avoid big refactor)
         // NOTE: DataForSeo DOES support batch tasks (up to 2000). We should USE that properly instead of loop!
         // This is a huge optimization over SerpApi loop.
         
         var points = GenerateGridPoints(lat, lng, radiusKm, gridSize);
         var results = new Dictionary<string, SerpResult>();
         
         // Batch sizes: DataForSEO allows many, but let's do safe chunks of 100 if needed. Grid is usually 7x7=49, so 1 batch is fine.
         
         var tasksArray = new JArray();
         foreach(var p in points)
         {
             var taskObj = new JObject
             {
                 ["keyword"] = keyword,
                 ["location_coordinate"] = $"{p.Lat},{p.Lng}",
                 ["language_code"] = "en",
                 ["depth"] = 20,
                 ["tag"] = $"{p.Lat},{p.Lng}" // Use tag to map back results!
             };
             tasksArray.Add(taskObj);
         }
         
         var content = new StringContent(tasksArray.ToString(), Encoding.UTF8, "application/json");
         var response = await _httpClient.PostAsync("v3/serp/google/maps/live/advanced", content);
         
         if (!response.IsSuccessStatusCode) throw new Exception($"DataForSeo Batch Error: {response.StatusCode}");
         
         var respString = await response.Content.ReadAsStringAsync();
         var respJson = JObject.Parse(respString);
         
         var returnedTasks = respJson["tasks"] as JArray;
         if (returnedTasks != null)
         {
             foreach (JObject task in returnedTasks)
             {
                 var tag = task["data"]?["tag"]?.ToString(); // "lat,lng"
                 if (tag == null) continue;
                 
                 var serpResult = new SerpResult();
                 var resultObj = task["result"] as JArray;
                 if (resultObj != null && resultObj.Count > 0)
                 {
                     var items = resultObj[0]["items"] as JArray;
                     if (items != null)
                     {
                         foreach (JObject item in items)
                         {
                              if (item["type"]?.ToString() != "maps_search") continue;
                              var pid = item["place_id"]?.ToString() ?? "";
                              var rank = item["rank_absolute"]?.Value<int>() ?? 0;
                              
                              serpResult.Competitors.Add(new SerpCompetitor
                              {
                                 Rank = rank,
                                 Name = item["title"]?.ToString() ?? "",
                                 PlaceId = pid
                              });
                              
                              if (pid == placeId) serpResult.UserRank = rank;
                         }
                     }
                 }
                 
                 results[tag] = serpResult;
             }
         }
         
         return results;
    }

    public async Task<List<ReviewResult>> GetReviewsAsync(string placeId)
    {
        // DataForSEO Maps Search doesn't give full reviews content in the 'search' endpoint.
        // There is 'Reviews' endpoint but it is separate. 
        // For now, return empty list as MVP or impl if user provides endpoint.
        // User only gave Maps Search endpoint.
        await Task.CompletedTask;
        return new List<ReviewResult>();
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
