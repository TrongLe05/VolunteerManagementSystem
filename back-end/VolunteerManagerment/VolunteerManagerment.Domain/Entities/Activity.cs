using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class Activity : BaseEntity, IAuditableEntity
{
    public Guid CampaignId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public int? Capacity { get; set; }
    public decimal CreditHours { get; set; }
    public decimal CreditDays { get; set; }
    public string Status { get; set; } = "DRAFT";
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation properties
    public Campaign Campaign { get; set; } = null!;
    public User Creator { get; set; } = null!;
    public ICollection<ActivityLocation> Locations { get; set; } = [];
}
