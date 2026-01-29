using System.Text;
using GmbSaas.Backend.Data;
using GmbSaas.Backend.Data.Entities;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using System.Net.Http.Headers;

namespace GmbSaas.Backend.Services;

public class LocationService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LocationService> _logger;
    private readonly HttpClient _httpClient;

    public LocationService(ApplicationDbContext context, IConfiguration configuration, ILogger<LocationService> logger, HttpClient httpClient)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _httpClient = httpClient;
        
        var login = _configuration["DataForSeo:Login"];
        var password = _configuration["DataForSeo:Password"];
        
        if (!string.IsNullOrEmpty(login) && !string.IsNullOrEmpty(password))
        {
             var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{login}:{password}"));
             _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authToken);
             _httpClient.BaseAddress = new Uri("https://api.dataforseo.com/");
        }
    }

    public async Task<List<CachedLocation>> SearchLocationsAsync(string query, string countryCode = "US")
    {
        query = query.ToLower();
        return await _context.CachedLocations
            .Where(l => l.CountryCode == countryCode && (l.Name.ToLower().Contains(query)))
            .OrderBy(l => l.Name.Length) // Prioritize exact matches (shorter)
            .Take(20)
            .ToListAsync();
    }

    public async Task SyncLocationsAsync(string countryCode = "US")
    {
        // DataForSEO Endpoint: v3/serp/google/locations/{country_code}
        // e.g. v3/serp/google/locations/us
        
        countryCode = countryCode.ToLower();
        var endpoint = $"v3/serp/google/locations/{countryCode}";
        
        _logger.LogInformation($"Syncing locations for {countryCode} from {endpoint}");
        
        var response = await _httpClient.GetAsync(endpoint);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            throw new Exception($"DataForSEO Sync Error: {response.StatusCode} - {err}");
        }

        var json = await response.Content.ReadAsStringAsync();
        var jObj = JObject.Parse(json);
        
        // tasks -> [0] -> result -> [ ... objects ... ]
        var tasks = jObj["tasks"] as JArray;
        if (tasks == null || tasks.Count == 0) return;
        
        var result = tasks[0]["result"] as JArray;
        if (result == null) return;

        var existingNames = new HashSet<string>(await _context.CachedLocations
            .Where(l => l.CountryCode == countryCode.ToUpper())
            .Select(l => l.Name)
            .ToListAsync());

        var newLocations = new List<CachedLocation>();

        foreach (var item in result)
        {
            var name = item["location_name"]?.ToString();
            var type = item["location_type"]?.ToString();
            
            if (string.IsNullOrEmpty(name)) continue;
            
            // Only add if not exists
            if (!existingNames.Contains(name))
            {
                newLocations.Add(new CachedLocation
                {
                    Name = name,
                    Type = type ?? "Unknown",
                    CountryCode = countryCode.ToUpper()
                });
            }
        }
        
        if (newLocations.Count > 0)
        {
            await _context.CachedLocations.AddRangeAsync(newLocations);
            await _context.SaveChangesAsync();
            _logger.LogInformation($"Added {newLocations.Count} new locations for {countryCode}.");
        }
        else
        {
             _logger.LogInformation($"No new locations found for {countryCode}.");
        }
    }
}
