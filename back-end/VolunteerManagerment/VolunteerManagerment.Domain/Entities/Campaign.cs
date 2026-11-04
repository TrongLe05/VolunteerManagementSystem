using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;

namespace VolunteerManagerment.Domain.Entities;

public class Campaign : BaseEntity, IAuditableEntity
{
    private static readonly HashSet<string> ValidStatuses =
    [
        "DRAFT", "OPEN", "ACTIVE", "ONGOING", "COMPLETED", "CANCELLED"
    ];

    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = "DRAFT";
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // navigation properties
    public Organization Organization { get; set; } = null!;
    public User Creator { get; set; } = null!;
    public ICollection<Activity> Activities { get; set; } = [];

    /// <summary>
    /// Quy tắc nghiệp vụ: Kiểm tra khoảng ngày bắt đầu và kết thúc của chiến dịch.
    /// </summary>
    public void ValidateDateRange()
    {
        if (EndDate < StartDate)
            throw new DomainException("Ngày kết thúc chiến dịch không được nhỏ hơn ngày bắt đầu.");
    }

    /// <summary>
    /// Quy tắc nghiệp vụ: Chuyển trạng thái chiến dịch.
    /// </summary>
    public void ChangeStatus(string newStatus, DateTimeOffset updatedAt)
    {
        if (string.IsNullOrWhiteSpace(newStatus) || !ValidStatuses.Contains(newStatus.ToUpperInvariant()))
            throw new DomainException($"Trạng thái chiến dịch '{newStatus}' không hợp lệ.");

        if (Status == "CANCELLED")
            throw new DomainException("Không thể thay đổi trạng thái của chiến dịch đã bị huỷ.");

        Status = newStatus.ToUpperInvariant();
        UpdatedAt = updatedAt;
    }
}
