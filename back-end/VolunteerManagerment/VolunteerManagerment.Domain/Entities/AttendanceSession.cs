using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class AttendanceSession : BaseEntity
{
    public Guid ActivityId { get; set; }
    public string Type { get; set; } = string.Empty;
    public  DateTimeOffset StartedAt { get; set; }
    public DateTimeOffset? EndedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    // Navigation properties
    public Activity Activity { get; set; } = null!;
    public User Creator { get; set; } = null!;
    public ICollection<Attendance> Attendances { get; set; } = [];
}
