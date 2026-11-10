using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.ValueObjects;

namespace VolunteerManagerment.Domain.Entities;

public class Attendance : BaseEntity
{
    public const int DefaultImageRetentionDays = 30;

    public Guid AttendanceSessionId { get; set; }
    public Guid ActivityRegistrationId { get; set; }
    public DateTimeOffset AttendedAt { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? LocationAccuracyMeters { get; set; }
    public string LocationStatus { get; set; } = "PENDING_REVIEW";
    public string VerificationMethod { get; set; } = "FACE_RECOGNITION";
    public decimal? FaceSimilarity { get; set; }
    public bool IsLivenessVerified { get; set; } = false;
    public string? CapturedImageUrl { get; set; }
    public DateTimeOffset? ImageExpiresAt { get; set; }
    public string Status { get; set; } = "PENDING";
    public decimal CreditEarned { get; set; } = 0.0m;
    public Guid? ReviewedBy { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public string? Note { get; set; }

    // Navigation properties
    public AttendanceSession AttendanceSession { get; set; } = null!;
    public ActivityRegistration ActivityRegistration { get; set; } = null!;
    public User? Reviewer { get; set; }

    /// <summary>
    /// Factory Method tạo bản ghi điểm danh tự động qua GPS Geofencing + Ảnh chụp khuôn mặt.
    /// </summary>
    public static Attendance CreateGeofenceFaceCheckIn(
        Guid sessionId,
        Guid registrationId,
        GpsCoordinate coordinate,
        decimal? accuracyMeters,
        bool isInsideGeofence,
        decimal distanceMeters,
        decimal allowedRadiusMeters,
        decimal activityCreditDays,
        string? capturedImageUrl,
        DateTimeOffset attendedAt)
    {
        return new Attendance
        {
            Id = Guid.NewGuid(),
            AttendanceSessionId = sessionId,
            ActivityRegistrationId = registrationId,
            AttendedAt = attendedAt,
            Latitude = coordinate.Latitude,
            Longitude = coordinate.Longitude,
            LocationAccuracyMeters = accuracyMeters,
            LocationStatus = isInsideGeofence ? "VALID" : "INVALID",
            VerificationMethod = "FACE_RECOGNITION",
            FaceSimilarity = 1.0m,
            IsLivenessVerified = true,
            CapturedImageUrl = capturedImageUrl,
            ImageExpiresAt = attendedAt.AddDays(DefaultImageRetentionDays),
            Status = isInsideGeofence ? "APPROVED" : "PENDING",
            CreditEarned = isInsideGeofence ? activityCreditDays : 0m,
            Note = isInsideGeofence
                ? $"Điểm danh thành công (Cách hiện trường {distanceMeters:F0}m)"
                : $"Ngoài vùng điểm danh ({distanceMeters:F0}m > {allowedRadiusMeters:F0}m)"
        };
    }

    /// <summary>
    /// Factory Method tạo bản ghi điểm danh thủ công bởi cán bộ Đoàn tại hiện trường.
    /// </summary>
    public static Attendance CreateManual(
        Guid sessionId,
        Guid registrationId,
        decimal creditDays,
        Guid reviewerId,
        DateTimeOffset attendedAt,
        string? note)
    {
        return new Attendance
        {
            Id = Guid.NewGuid(),
            AttendanceSessionId = sessionId,
            ActivityRegistrationId = registrationId,
            AttendedAt = attendedAt,
            LocationStatus = "VALID",
            VerificationMethod = "MANUAL",
            FaceSimilarity = 1.0m,
            IsLivenessVerified = true,
            Status = "APPROVED",
            CreditEarned = creditDays,
            ReviewedBy = reviewerId,
            ReviewedAt = attendedAt,
            Note = note ?? "Cán bộ điểm danh thủ công tại hiện trường"
        };
    }

    /// <summary>
    /// Duyệt thủ công một lượt điểm danh đã tồn tại.
    /// </summary>
    public void ApproveManually(Guid reviewerId, DateTimeOffset reviewedAt, string? note)
    {
        Status = "APPROVED";
        LocationStatus = "VALID";
        VerificationMethod = "MANUAL";
        ReviewedBy = reviewerId;
        ReviewedAt = reviewedAt;
        Note = note ?? "Cán bộ cập nhật điểm danh thủ công tại hiện trường";
    }
}
