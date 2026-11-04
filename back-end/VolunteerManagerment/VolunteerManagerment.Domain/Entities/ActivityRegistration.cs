using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;

namespace VolunteerManagerment.Domain.Entities;

public class ActivityRegistration : BaseEntity
{
    public Guid ActivityId { get; set; }
    public Guid VolunteerId { get; set; }
    public string Status { get; set; } = "REGISTERED";
    public DateTimeOffset RegisteredAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid? ApprovedBy { get; set; }
    public DateTimeOffset? ApprovedAt { get; set; }

    // navigation properties
    public Activity Activity { get; set; } = null!;
    public Volunteer Volunteer { get; set; } = null!;
    public User? Approved { get; set; }
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();

    /// <summary>
    /// Kiểm tra đơn đăng ký hiện có cản trở việc đăng ký mới hay không.
    /// </summary>
    public void EnsureCanRegisterAgain()
    {
        if (Status is "REGISTERED" or "APPROVED")
            throw new DomainException("Bạn đã đăng ký hoạt động này rồi.");

        if (Status is "REJECTED")
            throw new DomainException("Đơn đăng ký của bạn cho hoạt động này đã bị từ chối.");
    }

    /// <summary>
    /// Kích hoạt lại đơn đăng ký từng bị huỷ (CANCELLED -> REGISTERED).
    /// </summary>
    public void Reactivate(DateTimeOffset timestamp)
    {
        if (Status != "CANCELLED")
            throw new DomainException("Chỉ có thể kích hoạt lại đơn đăng ký đã huỷ.");

        Status = "REGISTERED";
        RegisteredAt = timestamp;
    }

    /// <summary>
    /// Kiểm tra đơn đăng ký đủ điều kiện để điểm danh.
    /// </summary>
    public void EnsureEligibleForCheckIn()
    {
        if (Status is not ("APPROVED" or "REGISTERED"))
            throw new DomainException("Hồ sơ đăng ký của bạn chưa được duyệt hoặc đã bị hủy.");
    }

    /// <summary>
    /// Quy tắc nghiệp vụ: Tình nguyện viên huỷ đơn đăng ký trước thời điểm bắt đầu hoạt động.
    /// </summary>
    public void Cancel(DateTimeOffset activityStartTime, DateTimeOffset currentTime)
    {
        if (Status is "CANCELLED" or null)
            throw new DomainException("Bạn chưa đăng ký hoạt động này hoặc đã huỷ trước đó.");

        if (Status is "REJECTED")
            throw new DomainException("Đơn đăng ký đã bị từ chối, không thể huỷ.");

        if (currentTime > activityStartTime)
            throw new DomainException("Không thể huỷ đăng ký khi hoạt động đã bắt đầu hoặc đã kết thúc.");

        Status = "CANCELLED";
    }

    /// <summary>
    /// Quy tắc nghiệp vụ: Cán bộ Đoàn duyệt hoặc từ chối đơn đăng ký của tình nguyện viên.
    /// </summary>
    public void Review(string newStatus, string activityStatus, Guid reviewerId, DateTimeOffset reviewedAt)
    {
        if (Status == "CANCELLED")
            throw new DomainException("Tình nguyện viên đã huỷ đơn đăng ký này, không thể duyệt.");

        if (activityStatus is "COMPLETED" or "CANCELLED")
            throw new DomainException("Hoạt động đã kết thúc hoặc bị huỷ, không thể duyệt đơn đăng ký.");

        Status = newStatus;
        ApprovedBy = reviewerId;
        ApprovedAt = reviewedAt;
    }
}
