namespace GmbSaas.Backend.Data.DTOs;

public class CompetitorAnalysisDto
{
    public string Keyword { get; set; } = string.Empty;
    public List<CompetitorRankDto> TopCompetitors { get; set; } = new();
}

public class CompetitorRankDto
{
    public string Name { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty;
    public double AverageRank { get; set; }
    public int AppearanceCount { get; set; }
    public int BestRank { get; set; }
}
