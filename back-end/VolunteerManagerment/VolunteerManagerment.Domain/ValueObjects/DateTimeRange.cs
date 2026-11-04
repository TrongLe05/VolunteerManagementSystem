using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;

namespace VolunteerManagerment.Domain.ValueObjects;

/// <summary>
/// Value Object biểu diễn khoảng thời gian diễn ra hoạt động hoặc phiên điểm danh.
/// </summary>
public sealed class DateTimeRange : ValueObject
{
    public DateTimeOffset StartTime { get; }
    public DateTimeOffset EndTime { get; }

    public TimeSpan Duration => EndTime - StartTime;

    public DateTimeRange(DateTimeOffset startTime, DateTimeOffset endTime)
    {
        if (endTime <= startTime)
            throw new DomainException("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");

        StartTime = startTime;
        EndTime = endTime;
    }

    public bool Contains(DateTimeOffset timestamp) => timestamp >= StartTime && timestamp <= EndTime;

    public bool Overlaps(DateTimeRange other)
    {
        ArgumentNullException.ThrowIfNull(other);
        return StartTime < other.EndTime && other.StartTime < EndTime;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return StartTime;
        yield return EndTime;
    }
}
