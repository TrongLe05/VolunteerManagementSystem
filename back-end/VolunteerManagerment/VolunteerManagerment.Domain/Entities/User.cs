namespace VolunteerManagerment.Domain.Entities;

public class User : BaseEntity
{
    public Guid OrganizationId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTimeOffset LastLoginAt { get; set; }

    // Navigation properties
    public Organization Organization { get; set; } = null!;
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
