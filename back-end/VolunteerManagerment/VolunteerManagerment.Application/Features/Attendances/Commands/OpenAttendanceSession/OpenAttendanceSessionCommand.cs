using MediatR;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.OpenAttendanceSession;

public record OpenAttendanceSessionCommand(
    Guid ActivityId,
    string Type,
    int? DurationMinutes = null
) : IRequest<Guid>;
