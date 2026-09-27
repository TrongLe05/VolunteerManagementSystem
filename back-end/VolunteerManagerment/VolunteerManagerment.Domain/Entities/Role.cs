namespace VolunteerManagerment.Domain.Entities;

public class Role
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    // Navigation properties
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}
