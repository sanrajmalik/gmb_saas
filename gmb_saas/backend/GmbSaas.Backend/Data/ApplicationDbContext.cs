using Microsoft.EntityFrameworkCore;

namespace GmbSaas.Backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<Entities.Listing> Listings { get; set; }
    public DbSet<Entities.Keyword> Keywords { get; set; }
    public DbSet<Entities.RankHistory> RankHistory { get; set; }
    public DbSet<Entities.CompetitorResult> CompetitorResults { get; set; }
    public DbSet<Entities.Review> Reviews { get; set; }
    public DbSet<Entities.GeoGridScan> GeoGridScans { get; set; }
    public DbSet<Entities.GeoGridPoint> GeoGridPoints { get; set; }
    public DbSet<Entities.GeoGridCompetitor> GeoGridCompetitors { get; set; }
    public DbSet<Entities.User> Users { get; set; }
}
