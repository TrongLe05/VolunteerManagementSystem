using MediatR;
using VolunteerManagerment.Application.Features.Auth.DTOs;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Login;

public record LoginCommand(
    string UsernameOrEmail,
    string Password
) : IRequest<LoginResponseDto>;
