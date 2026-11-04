namespace VolunteerManagerment.Application.Features.Attendances.DTOs;

public record ActiveAttendanceSessionDto(
    Guid Id,
    Guid ActivityId,
    string ActivityName,
    string Type,
    DateTimeOffset StartedAt,
    DateTimeOffset? EndedAt,
    int RemainingSeconds,
    bool HasAttended
);

