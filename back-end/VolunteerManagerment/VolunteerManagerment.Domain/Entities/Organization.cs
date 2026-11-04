using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;

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
    public ICollection<Organization> Children { get; set; } = [];
    public ICollection<Campaign> Campaigns { get; set; } = [];
    public ICollection<User> Users { get; set; } = [];

    /// <summary>
    /// Kiểm tra tổ chức có đủ điều kiện làm tổ chức cấp trên hay không.
    /// </summary>
    public void EnsureActiveAsParent()
    {
        if (!IsActive)
            throw new DomainException("Tổ chức cha không tồn tại hoặc đã ngừng hoạt động.");
    }

    /// <summary>
    /// Cập nhật thông tin đơn vị/tổ chức Đoàn - Hội.
    /// </summary>
    public void UpdateDetails(string code, string name, string? description, bool isActive, DateTimeOffset updatedAt)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new DomainException("Mã tổ chức không được để trống.");

        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException("Tên tổ chức không được để trống.");

        Code = code.Trim();
        Name = name.Trim();
        Description = string.IsNullOrWhiteSpace(description) ? null : description.Trim();
        IsActive = isActive;
        UpdatedAt = updatedAt;
    }

    public void Deactivate(DateTimeOffset updatedAt)
    {
        IsActive = false;
        UpdatedAt = updatedAt;
    }

    public void Activate(DateTimeOffset updatedAt)
    {
        IsActive = true;
        UpdatedAt = updatedAt;
    }
}
