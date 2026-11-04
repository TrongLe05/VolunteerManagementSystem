using FluentAssertions;
using VolunteerManagerment.Domain.Exceptions;
using VolunteerManagerment.Domain.ValueObjects;
using Xunit;

namespace VolunteerManagerment.Tests.Domain;

public class DateTimeRangeValueObjectTests
{
    [Fact]
    public void Constructor_WhenEndTimeIsAfterStartTime_ShouldCalculateDurationAndBoundaryContainment()
    {
        var start = new DateTimeOffset(2026, 11, 5, 7, 0, 0, TimeSpan.FromHours(7));
        var end = new DateTimeOffset(2026, 11, 5, 11, 0, 0, TimeSpan.FromHours(7));

        var range1 = new DateTimeRange(start, end);
        var range2 = new DateTimeRange(start, end);

        range1.Should().Be(range2);
        range1.GetHashCode().Should().Be(range2.GetHashCode());
        range1.Duration.Should().Be(TimeSpan.FromHours(4));

        // Boundary and interior checks
        range1.Contains(start).Should().BeTrue();
        range1.Contains(end).Should().BeTrue();
        range1.Contains(start.AddHours(2)).Should().BeTrue();
        range1.Contains(start.AddSeconds(-1)).Should().BeFalse();
        range1.Contains(end.AddSeconds(1)).Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-15)]
    public void Constructor_WhenEndTimeIsLessOrEqualStartTime_ShouldThrowDomainException(int offsetMinutes)
    {
        var now = DateTimeOffset.UtcNow;

        var act = () => new DateTimeRange(now, now.AddMinutes(offsetMinutes));

        act.Should().Throw<DomainException>()
            .WithMessage("*Thời gian kết thúc phải lớn hơn thời gian bắt đầu*");
    }

    [Fact]
    public void Overlaps_ShouldDetectOverlappingTouchingAndDisjointTimeSlots()
    {
        var baseStart = new DateTimeOffset(2026, 11, 5, 8, 0, 0, TimeSpan.Zero);
        var morningSlot = new DateTimeRange(baseStart, baseStart.AddHours(3));                // 08:00 - 11:00
        var partialOverlapSlot = new DateTimeRange(baseStart.AddHours(2), baseStart.AddHours(4)); // 10:00 - 12:00
        var touchingBoundarySlot = new DateTimeRange(baseStart.AddHours(3), baseStart.AddHours(5)); // 11:00 - 13:00
        var afternoonSlot = new DateTimeRange(baseStart.AddHours(5), baseStart.AddHours(7));  // 13:00 - 15:00

        morningSlot.Overlaps(partialOverlapSlot).Should().BeTrue();
        morningSlot.Overlaps(touchingBoundarySlot).Should().BeFalse();
        morningSlot.Overlaps(afternoonSlot).Should().BeFalse();

        var actNull = () => morningSlot.Overlaps(null!);
        actNull.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void DomainException_Constructors_ShouldPreserveMessageAndInnerException()
    {
        var inner = new ArgumentException("Lỗi gốc");
        var ex = new DomainException("Vi phạm nghiệp vụ Domain", inner);

        ex.Message.Should().Be("Vi phạm nghiệp vụ Domain");
        ex.InnerException.Should().BeSameAs(inner);
    }
}
