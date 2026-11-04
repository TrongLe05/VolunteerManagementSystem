namespace VolunteerManagerment.Application.Features.Attendances.DTOs;

public record ActivityAttendanceOverviewDto(
    Guid ActivityId,
    string ActivityName,
    string CampaignName,
    string OrganizationName,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    int TotalRegistered,
    int TotalAttended,
    int TotalCheckedIn,
    int TotalCheckedOut,
    int TotalAbsent,
    ActiveAttendanceSessionDto? ActiveSession,
    List<ActivityVolunteerAttendanceDto> Volunteers
);

public record ActivityVolunteerAttendanceDto(
    Guid RegistrationId,
    Guid VolunteerId,
    string FullName,
    string? StudentCode,
    string? ClassName,
    string? Phone,
    string RegistrationStatus,
    AttendanceRecordDetailDto? CheckIn,
    AttendanceRecordDetailDto? CheckOut
);

public record AttendanceRecordDetailDto(
    Guid AttendanceId,
    DateTimeOffset AttendedAt,
    string LocationStatus,
    decimal? LocationAccuracyMeters,
    string VerificationMethod,
    decimal? FaceSimilarity,
    bool IsLivenessVerified,
    string? CapturedImageUrl,
    string Status
);
