using FluentAssertions;
using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;
using VolunteerManagerment.Domain.ValueObjects;
using Xunit;

namespace VolunteerManagerment.Tests.Domain;

public class GpsCoordinateValueObjectTests
{
    [Fact]
    public void GpsCoordinate_WithSameLatitudeAndLongitude_ShouldBeEqualByValueAndOperators()
    {
        var coord1 = new GpsCoordinate(10.4602000m, 105.6426000m);
        var coord2 = new GpsCoordinate(10.4602000m, 105.6426000m);
        var differentCoord = new GpsCoordinate(10.4610000m, 105.6426000m);
        GpsCoordinate? nullCoord1 = null;
        GpsCoordinate? nullCoord2 = null;

        coord1.Should().BeAssignableTo<ValueObject>();
        coord1.Equals(coord2).Should().BeTrue();
        coord1.Equals((object)coord2).Should().BeTrue();
        coord1.Equals("not-a-coordinate").Should().BeFalse();

        (coord1 == coord2).Should().BeTrue();
        (coord1 != coord2).Should().BeFalse();
        (coord1 == nullCoord1).Should().BeFalse();
        (nullCoord1 == coord1).Should().BeFalse();
        (nullCoord1 == nullCoord2).Should().BeTrue();
        coord1.GetHashCode().Should().Be(coord2.GetHashCode());

        coord1.Should().NotBe(differentCoord);
        (coord1 != differentCoord).Should().BeTrue();
        coord1.Equals((object?)null).Should().BeFalse();
    }

    [Theory]
    [InlineData(-90, -180)]
    [InlineData(90, 180)]
    [InlineData(0, 0)]
    public void Constructor_WhenCoordinatesAreAtExactEarthBoundaries_ShouldSucceed(
        decimal validLat,
        decimal validLon)
    {
        var coord = new GpsCoordinate(validLat, validLon);

        coord.Latitude.Should().Be(validLat);
        coord.Longitude.Should().Be(validLon);
    }

    [Theory]
    [InlineData(-90.0001, 105.0)]
    [InlineData(90.0001, 105.0)]
    [InlineData(10.5, -180.0001)]
    [InlineData(10.5, 180.0001)]
    public void Constructor_WhenCoordinatesOutOfValidEarthBounds_ShouldThrowDomainException(
        double invalidLat,
        double invalidLon)
    {
        var act = () => new GpsCoordinate((decimal)invalidLat, (decimal)invalidLon);

        act.Should().Throw<DomainException>();
    }

    [Fact]
    public void DistanceInMetersTo_WhenTargetIsNull_ShouldThrowArgumentNullException()
    {
        var coord = new GpsCoordinate(10.4602m, 105.6426m);

        var act = () => coord.DistanceInMetersTo(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void DistanceInMetersTo_WhenSameCoordinate_ShouldReturnZero()
    {
        var dthuGate = new GpsCoordinate(10.4602000m, 105.6426000m);

        var distance = dthuGate.DistanceInMetersTo(dthuGate);

        distance.Should().Be(0m);
    }

    [Fact]
    public void IsWithinRadius_ShouldAccuratelyEvaluate150mGeofence()
    {
        var dthuGate = new GpsCoordinate(10.4602000m, 105.6426000m);
        var nearbyStudent = new GpsCoordinate(10.4605000m, 105.6427000m); // ~35m away
        var farStudent = new GpsCoordinate(10.4700000m, 105.6500000m);    // >1300m away

        nearbyStudent.IsWithinRadius(dthuGate, 150m).Should().BeTrue();
        farStudent.IsWithinRadius(dthuGate, 150m).Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-50)]
    public void IsWithinRadius_WhenRadiusIsZeroOrNegative_ShouldThrowDomainException(decimal invalidRadius)
    {
        var coord = new GpsCoordinate(10.4602m, 105.6426m);

        var act = () => coord.IsWithinRadius(coord, invalidRadius);

        act.Should().Throw<DomainException>()
            .WithMessage("*Bán kính Geofence cho phép phải lớn hơn 0 mét*");
    }
}
