using System.ComponentModel.DataAnnotations;

namespace GmbSaas.Backend.Data.DTOs;

public class KeywordDto
{
    public Guid Id { get; set; }
    public string Term { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Group { get; set; } = "General";
    public int LatestRank { get; set; } // 0 if not tracked yet
}

public class CreateKeywordDto
{
    [Required]
    public string Term { get; set; } = string.Empty;
    [Required]
    public string Location { get; set; } = string.Empty;
    public string Group { get; set; } = "General";
}
