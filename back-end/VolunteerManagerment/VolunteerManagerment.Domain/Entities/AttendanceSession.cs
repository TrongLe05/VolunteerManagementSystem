using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class AttendanceSession : BaseEntity
{
    public Guid ActivityId { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation properties
    public Activity Activity { get; set; } = null!;
    public User Creator { get; set; } = null!;
    public ICollection<Attendance> Attendances { get; set; } = [];

    /// <summary>
    /// Kiểm tra phiên điểm danh còn hiệu lực tại thời điểm chỉ định hay không.
    /// </summary>
    public bool IsActiveAt(DateTimeOffset timestamp) => !EndedAt.HasValue || EndedAt.Value > timestamp;

    /// <summary>
    /// Đóng phiên điểm danh ngay lập tức.
    /// </summary>
    public void Close(DateTimeOffset closedAt)
    {
        EndedAt = closedAt;
    }
}
