using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class ActivityLocation : BaseEntity
{
    public Guid ActivityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal AllowedRadiusMeters { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation properties
    public Activity Activity { get; set; } = null!;
}
