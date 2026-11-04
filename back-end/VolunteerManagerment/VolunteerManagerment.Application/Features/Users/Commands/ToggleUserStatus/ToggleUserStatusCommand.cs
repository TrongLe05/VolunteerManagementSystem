using MediatR;

namespace VolunteerManagerment.Application.Features.Users.Commands.ToggleUserStatus;

public record ToggleUserStatusCommand(Guid Id, bool IsActive) : IRequest<bool>;
