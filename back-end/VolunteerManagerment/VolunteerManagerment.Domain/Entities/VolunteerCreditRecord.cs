using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class VolunteerCreditRecord : BaseEntity
{
    public const string RecordTypeActivityCompletion = "ACTIVITY_COMPLETION";
    public const string RecordTypeManualAward = "MANUAL_AWARD";
    public const string RecordTypeBloodDonation = "BLOOD_DONATION";
    public const string RecordTypeAdjustment = "ADJUSTMENT";
    public const string RecordTypePenalty = "PENALTY";

    public const string StatusOfficial = "OFFICIAL";
    public const string StatusRevoked = "REVOKED";

    public Guid VolunteerId { get; set; }
    public Guid? ActivityId { get; set; }
    public Guid? ActivityRegistrationId { get; set; }
    public decimal CreditDays { get; set; }
    public string RecordType { get; set; } = RecordTypeActivityCompletion;
    public DateTimeOffset AwardedAt { get; set; } = DateTimeOffset.UtcNow;
    public Guid? AwardedBy { get; set; }
    public string? Reason { get; set; }
    public string Status { get; set; } = StatusOfficial;

    // Navigation properties
    public Volunteer Volunteer { get; set; } = null!;
    public Activity? Activity { get; set; }
    public ActivityRegistration? ActivityRegistration { get; set; }
    public User? Awarder { get; set; }

    /// <summary>
    /// Factory Method: Tự động ghi nhận ngày công vào sổ cái khi hoàn thành đủ cả 2 lượt Check-in và Check-out hợp lệ.
    /// </summary>
    public static VolunteerCreditRecord CreateForActivityCompletion(
        Guid volunteerId,
        Guid activityId,
        Guid registrationId,
        decimal creditDays,
        DateTimeOffset awardedAt,
        string? activityName = null)
    {
        return new VolunteerCreditRecord
        {
            Id = Guid.NewGuid(),
            VolunteerId = volunteerId,
            ActivityId = activityId,
            ActivityRegistrationId = registrationId,
            CreditDays = creditDays,
            RecordType = RecordTypeActivityCompletion,
            AwardedAt = awardedAt,
            AwardedBy = null,
            Reason = string.IsNullOrWhiteSpace(activityName)
                ? "Tự động công nhận ngày công khi hoàn thành đủ cả 2 lượt Check-in và Check-out."
                : $"Tự động công nhận ngày công khi hoàn tất hoạt động: {activityName}.",
            Status = StatusOfficial
        };
    }

    /// <summary>
    /// Factory Method: Cán bộ Đoàn / Quản trị viên cấp hoặc điều chỉnh ngày công thủ công.
    /// </summary>
    public static VolunteerCreditRecord CreateManual(
        Guid volunteerId,
        decimal creditDays,
        string recordType,
        string reason,
        Guid awardedBy,
        DateTimeOffset awardedAt,
        Guid? activityId = null)
    {
        return new VolunteerCreditRecord
        {
            Id = Guid.NewGuid(),
            VolunteerId = volunteerId,
            ActivityId = activityId,
            ActivityRegistrationId = null,
            CreditDays = creditDays,
            RecordType = string.IsNullOrWhiteSpace(recordType) ? RecordTypeManualAward : recordType.ToUpperInvariant(),
            AwardedAt = awardedAt,
            AwardedBy = awardedBy,
            Reason = reason,
            Status = StatusOfficial
        };
    }

    /// <summary>
    /// Thu hồi bản ghi ngày công (nếu phát hiện gian lận hoặc sai sót).
    /// </summary>
    public void Revoke(string? revokeReason = null)
    {
        Status = StatusRevoked;
        if (!string.IsNullOrWhiteSpace(revokeReason))
        {
            Reason = $"{Reason} (Đã thu hồi: {revokeReason})";
        }
    }
}
