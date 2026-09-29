using MediatR;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Logout;

public record LogoutCommand(string RefreshToken) : IRequest<bool>;
