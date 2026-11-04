using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.ValueObjects;

namespace VolunteerManagerment.Domain.Entities;

public class ActivityLocation : BaseEntity
{
    public const decimal DefaultAllowedRadiusMeters = 150m;

    public Guid ActivityId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public decimal AllowedRadiusMeters { get; set; } = DefaultAllowedRadiusMeters;
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation properties
    public Activity Activity { get; set; } = null!;

    public GpsCoordinate GetCoordinate() => new(Latitude, Longitude);

    public decimal CalculateDistanceInMeters(GpsCoordinate volunteerCoordinate)
    {
        return volunteerCoordinate.DistanceInMetersTo(GetCoordinate());
    }

    public bool IsWithinGeofence(GpsCoordinate volunteerCoordinate)
    {
        var effectiveRadius = AllowedRadiusMeters > 0m ? AllowedRadiusMeters : DefaultAllowedRadiusMeters;
        return volunteerCoordinate.IsWithinRadius(GetCoordinate(), effectiveRadius);
    }
}
