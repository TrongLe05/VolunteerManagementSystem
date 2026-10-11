using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class Campaign : BaseEntity, IAuditableEntity
{
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = "DRAFT";
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // navigation properties
    public Organization Organization { get; set; } = null!;
    public User Creator { get; set; } = null!;
    //public ICollection<Activity> Activity { get; set; } = new List<Activity>();
}
