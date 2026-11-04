namespace VolunteerManagerment.Application.Features.Attendances.DTOs;

public record AttendanceSessionItemDto(
    Guid Id,
    Guid ActivityId,
    string ActivityName,
    Guid OrganizationId,
    string OrganizationName,
    string Type,
    DateTimeOffset StartedAt,
    DateTimeOffset? EndedAt,
    bool IsActive,
    int RemainingSeconds,
    int TotalAttended,
    string CreatedByUsername
);
