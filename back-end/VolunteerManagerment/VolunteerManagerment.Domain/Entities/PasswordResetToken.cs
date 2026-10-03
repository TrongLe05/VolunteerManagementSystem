using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class PasswordResetToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation property
    public User User { get; set; } = null!;

    public bool IsValid => !IsUsed && DateTimeOffset.UtcNow <= ExpiresAt;
}
