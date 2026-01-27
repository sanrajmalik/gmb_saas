using System.ComponentModel.DataAnnotations;

namespace GmbSaas.Backend.Data.Entities;

public class User
{
    [Key]
    public Guid Id { get; set; }
    
    [Required]
    public string Email { get; set; } = string.Empty;
    
    public string Name { get; set; } = string.Empty;
    public string PictureUrl { get; set; } = string.Empty;
    
    public UserTier Tier { get; set; } = UserTier.Free;
    
    public int Credits { get; set; } = 100;
    
    public int MaxKeywords { get; set; } = 20; // Default for Free tier
    public int MaxListings { get; set; } = 1; // Default for Free tier
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastCreditReset { get; set; } = DateTime.UtcNow;
    
    public ICollection<Listing> Listings { get; set; } = new List<Listing>();
}

public enum UserTier
{
    Free,
    Paid
}
