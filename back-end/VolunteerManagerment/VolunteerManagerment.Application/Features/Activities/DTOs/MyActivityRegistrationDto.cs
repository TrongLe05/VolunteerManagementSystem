namespace VolunteerManagerment.Application.Features.Activities.DTOs;

public record MyAttendanceRecordDto(
    Guid Id,
    string SessionType,
    DateTimeOffset AttendedAt,
    string LocationStatus,
    decimal? LocationAccuracyMeters,
    string VerificationMethod,
    decimal? FaceSimilarity,
    bool IsLivenessVerified,
    string? CapturedImageUrl,
    string Status,
    decimal CreditEarned,
    string? Note
);

public record MyActivityRegistrationDto(
    Guid RegistrationId,
    Guid ActivityId,
    string ActivityName,
    string CampaignName,
    string OrganizationName,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    decimal CreditDay,
    decimal EarnedCreditDays,
    bool IsAttendanceCompleted,
    string ActivityStatus,
    string RegistrationStatus,
    DateTimeOffset RegisteredAt,
    DateTimeOffset? ApproveAt,
    IReadOnlyList<MyAttendanceRecordDto> Attendances
);
