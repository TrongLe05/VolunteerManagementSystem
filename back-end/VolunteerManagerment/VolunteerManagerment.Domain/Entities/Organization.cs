using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class Organization : BaseEntity, IAuditableEntity
{
    public Guid? ParentId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation properties
    public Organization? Parent { get; set; }
    public ICollection<Organization> Children { get; set; } = new List<Organization>();
    public ICollection<User> Users { get; set; } = new List<User>();
}
