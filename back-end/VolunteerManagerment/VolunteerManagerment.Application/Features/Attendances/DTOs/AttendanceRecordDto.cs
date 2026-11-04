namespace VolunteerManagerment.Application.Features.Attendances.DTOs;

public record AttendanceRecordDto(
    Guid Id,
    Guid VolunteerId,
    string VolunteerName,
    string? StudentCode,
    string? ClassName,
    DateTimeOffset AttendedAt,
    decimal? Latitude,
    decimal? Longitude,
    decimal? LocationAccuracyMeters,
    string LocationStatus,
    string VerificationMethod,
    decimal? FaceSimilarity,
    bool IsLivenessVerified,
    string? CapturedImageUrl,
    string Status,
    string? Note
);
