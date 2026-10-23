using VolunteerManagerment.Domain.Common;

namespace VolunteerManagerment.Domain.Entities;

public class Attendance : BaseEntity
{
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
}
