using MediatR;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.ReviewSuspiciousAttendance;

public record ReviewSuspiciousAttendanceCommand(
    Guid AttendanceId,
    string Status,
    string? Note = null
) : IRequest<bool>;
