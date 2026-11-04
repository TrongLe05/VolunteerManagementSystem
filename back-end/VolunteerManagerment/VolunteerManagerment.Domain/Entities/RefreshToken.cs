using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;

namespace VolunteerManagerment.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }

    // Navigation property
    public User User { get; set; } = null!;

    // Helper kiểm tra token còn hiệu lực không
    public bool IsExpired => DateTimeOffset.UtcNow >= ExpiresAt;
    public bool IsActive => !IsRevoked && !IsExpired;

    /// <summary>
    /// Quy tắc nghiệp vụ: Thu hồi Refresh Token khi đăng xuất hoặc cấp mới.
    /// </summary>
    public void Revoke(DateTimeOffset revokedAt)
    {
        if (IsRevoked)
            throw new DomainException("Refresh token đã bị thu hồi trước đó.");

        IsRevoked = true;
        RevokedAt = revokedAt;
    }

    /// <summary>
    /// Đảm bảo Refresh Token còn hiệu lực trước khi làm mới phiên.
    /// </summary>
    public void EnsureActive()
    {
        if (!IsActive)
            throw new UnauthorizedAccessException("Refresh token không hợp lệ hoặc đã hết hạn.");
    }
}
