using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;

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

    /// <summary>
    /// Quy tắc nghiệp vụ: Xác nhận và đánh dấu mã OTP khôi phục mật khẩu đã được sử dụng.
    /// </summary>
    public void MarkAsUsed(DateTimeOffset currentTime)
    {
        if (IsUsed)
            throw new DomainException("Mã xác thực OTP đã được sử dụng.");

        if (currentTime > ExpiresAt)
            throw new DomainException("Mã xác thực OTP đã hết hạn.");

        IsUsed = true;
    }
}
