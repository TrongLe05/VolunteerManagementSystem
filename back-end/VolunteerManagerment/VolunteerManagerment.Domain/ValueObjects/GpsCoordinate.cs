using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;

namespace VolunteerManagerment.Domain.ValueObjects;

/// <summary>
/// Value Object biểu diễn tọa độ GPS và đóng gói công thức Haversine tính khoảng cách Geofencing.
/// </summary>
public sealed class GpsCoordinate : ValueObject
{
    private const double EarthRadiusMeters = 6371000.0;

    public decimal Latitude { get; }
    public decimal Longitude { get; }

    public GpsCoordinate(decimal latitude, decimal longitude)
    {
        if (latitude is < -90m or > 90m)
            throw new DomainException("Vĩ độ (Latitude) phải nằm trong khoảng từ -90 đến 90 độ.");

        if (longitude is < -180m or > 180m)
            throw new DomainException("Kinh độ (Longitude) phải nằm trong khoảng từ -180 đến 180 độ.");

        Latitude = latitude;
        Longitude = longitude;
    }

    /// <summary>
    /// Tính khoảng cách mặt cầu (mét) giữa hai tọa độ GPS theo công thức Haversine.
    /// </summary>
    public decimal DistanceInMetersTo(GpsCoordinate target)
    {
        ArgumentNullException.ThrowIfNull(target);

        var dLat = ToRadians((double)(target.Latitude - Latitude));
        var dLon = ToRadians((double)(target.Longitude - Longitude));

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians((double)Latitude)) * Math.Cos(ToRadians((double)target.Latitude)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return (decimal)(EarthRadiusMeters * c);
    }

    /// <summary>
    /// Kiểm tra tọa độ hiện tại có nằm trong bán kính cho phép của tọa độ đích hay không.
    /// </summary>
    public bool IsWithinRadius(GpsCoordinate target, decimal allowedRadiusMeters)
    {
        if (allowedRadiusMeters <= 0m)
            throw new DomainException("Bán kính Geofence cho phép phải lớn hơn 0 mét.");

        return DistanceInMetersTo(target) <= allowedRadiusMeters;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Latitude;
        yield return Longitude;
    }

    private static double ToRadians(double degrees) => degrees * (Math.PI / 180.0);
}
