using MediatR;

namespace VolunteerManagerment.Application.Features.Users.Commands.AdminResetPassword;

public record AdminResetPasswordCommand(Guid Id, string NewPassword) : IRequest<bool>;
