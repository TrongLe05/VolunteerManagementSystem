using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;

namespace VolunteerManagerment.Domain.Entities;

public class Volunteer : BaseEntity, IAuditableEntity
{
    public Guid? UserId { get; set; }
    public Guid OrganizationId { get; set; }
    public string VolunteerCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public DateOnly? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public string? Phone { get; set; }
    public string? StudentCode { get; set; }
    public string? ClassName { get; set; }
    public DateOnly? JoinedAt { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ConsentFaceAuth { get; set; } = false;
    public DateTimeOffset? ConsentGivenAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation properties
    public User? User { get; set; }
    public Organization Organization { get; set; } = null!;
    public ICollection<ActivityRegistration> Registrations { get; set; } = [];

    /// <summary>
    /// Quy tắc nghiệp vụ Nghị định 13/2023/NĐ-CP: Cấp hoặc rút lại sự đồng ý xử lý dữ liệu sinh trắc học khuôn mặt.
    /// </summary>
    public void ApplyFaceBiometricConsent(bool consentGranted, DateTimeOffset timestamp)
    {
        if (consentGranted)
        {
            GrantFaceBiometricConsent(timestamp);
        }
        else
        {
            RevokeFaceBiometricConsent();
        }
        UpdatedAt = timestamp;
    }

    public void GrantFaceBiometricConsent(DateTimeOffset timestamp)
    {
        if (!ConsentFaceAuth || !ConsentGivenAt.HasValue)
        {
            ConsentGivenAt = timestamp;
        }
        ConsentFaceAuth = true;
    }

    public void RevokeFaceBiometricConsent()
    {
        ConsentFaceAuth = false;
        ConsentGivenAt = null;
    }

    /// <summary>
    /// Kiểm tra điều kiện hợp lệ của hồ sơ Tình nguyện viên trước khi đăng ký hoạt động.
    /// </summary>
    public void EnsureEligibleForActivityRegistration()
    {
        if (!IsActive)
            throw new UnauthorizedAccessException("Hồ sơ tình nguyện viên của bạn đang bị khoá.");

        if (string.IsNullOrWhiteSpace(StudentCode))
            throw new DomainException("Bạn cần cập nhật Mã số sinh viên (MSSV) trong mục Thông tin tài khoản trước khi đăng ký hoạt động này.");
    }

    /// <summary>
    /// Kế thừa thông tin từ hồ sơ được import trước qua Excel (khi chưa gắn tài khoản UserId).
    /// </summary>
    public void InheritFromImportedRecord(Volunteer importedRecord)
    {
        ArgumentNullException.ThrowIfNull(importedRecord);

        if (string.IsNullOrWhiteSpace(ClassName) && !string.IsNullOrWhiteSpace(importedRecord.ClassName))
            ClassName = importedRecord.ClassName;

        if (!DateOfBirth.HasValue && importedRecord.DateOfBirth.HasValue)
            DateOfBirth = importedRecord.DateOfBirth;

        if (string.IsNullOrWhiteSpace(Phone) && !string.IsNullOrWhiteSpace(importedRecord.Phone))
            Phone = importedRecord.Phone;

        if (string.IsNullOrWhiteSpace(Gender) && !string.IsNullOrWhiteSpace(importedRecord.Gender))
            Gender = importedRecord.Gender;

        if (importedRecord.OrganizationId != Guid.Empty && OrganizationId == Guid.Empty)
            OrganizationId = importedRecord.OrganizationId;
    }
}
