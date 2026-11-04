using MediatR;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.CloseAttendanceSession;

public record CloseAttendanceSessionCommand(Guid SessionId) : IRequest<bool>;
