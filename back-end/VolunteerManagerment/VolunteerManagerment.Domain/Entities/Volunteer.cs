using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class Volunteer : BaseEntity, IAuditableEntity
{
    public Guid? UserId { get; set; }
    public Guid OrganizationId { get; set; }
    public string VolunteerCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Phone { get; set; }
    public string? StudentCode { get; set; }
    public string? ClassName { get; set; }
    public DateOnly? JoinedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ConsentFaceAuth { get; set; } = false;
    public DateTimeOffset? ConsentGivenAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation properties
    public User? User { get; set; }
    public Organization Organization { get; set; } = null!;
}
