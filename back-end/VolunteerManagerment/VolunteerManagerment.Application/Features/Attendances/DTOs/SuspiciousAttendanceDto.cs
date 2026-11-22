namespace VolunteerManagerment.Application.Features.Attendances.DTOs;

public record SuspiciousAttendanceDto(
    Guid AttendanceId,
    Guid ActivityId,
    string ActivityName,
    string OrganizationName,
    Guid VolunteerId,
    string VolunteerName,
    string? StudentCode,
    string SessionType,              // "CHECK_IN" | "CHECK_OUT"
    DateTimeOffset AttendedAt,
    decimal? Latitude,
    decimal? Longitude,
    decimal? LocationAccuracyMeters,
    string LocationStatus,           // "INVALID"
    string Status,                   // "PENDING" | "APPROVED" | "REJECTED"
    string? CapturedImageUrl,        // Link ảnh selfie bằng chứng
    string? Note,                    // VD: "Ngoài vùng điểm danh (240m > 150m)"
    DateTimeOffset? ReviewedAt,
    string? ReviewerEmail
);

