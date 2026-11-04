using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;

namespace VolunteerManagerment.Domain.Entities;

public class User : BaseEntity, IAuditableEntity
{
    public Guid OrganizationId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTimeOffset LastLoginAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation properties
    public Organization Organization { get; set; } = null!;
    public ICollection<UserRole> UserRoles { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<Campaign> Campaigns { get; set; } = [];

    /// <summary>
    /// Kiểm tra tài khoản còn hoạt động khi đăng nhập.
    /// </summary>
    public void EnsureActiveForLogin()
    {
        if (!IsActive)
            throw new UnauthorizedAccessException("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị!");
    }

    public void RecordLogin(DateTimeOffset loginTimestamp)
    {
        LastLoginAt = loginTimestamp;
    }

    public List<string> GetRoleCodes()
    {
        return UserRoles
            .Where(ur => ur.Role != null && !string.IsNullOrWhiteSpace(ur.Role.Code))
            .Select(ur => ur.Role.Code)
            .ToList();
    }

    public bool HasRole(string roleCode)
    {
        return UserRoles.Any(ur =>
            ur.Role != null &&
            string.Equals(ur.Role.Code, roleCode, StringComparison.OrdinalIgnoreCase));
    }

    public void UpdateAvatar(string avatarUrl, DateTimeOffset updatedAt)
    {
        if (string.IsNullOrWhiteSpace(avatarUrl))
            throw new DomainException("Đường dẫn ảnh đại diện không được để trống.");

        AvatarUrl = avatarUrl.Trim();
        UpdatedAt = updatedAt;
    }

    public void ToggleActiveStatus(DateTimeOffset updatedAt)
    {
        IsActive = !IsActive;
        UpdatedAt = updatedAt;
    }
}
