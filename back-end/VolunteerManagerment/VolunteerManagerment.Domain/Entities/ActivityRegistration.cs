using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class ActivityRegistration : BaseEntity
{
    public Guid ActivityId { get; set; }
    public Guid VolunteerId { get; set; }
    public string Status { get; set; } = "REGISTERED";
    public DateTimeOffset RegisteredAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid? ApprovedBy { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }

    // navigation properties
    public Activity Activity { get; set; } = null!;
    public Volunteer Volunteer { get; set; } = null!;
    public User? Approved { get; set; }
}
