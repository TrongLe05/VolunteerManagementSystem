using MediatR;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.ManualMarkAttendance;

public record ManualMarkAttendanceCommand(
    Guid RegistrationId,
    string Type,
    string? Note = null
) : IRequest<bool>;
