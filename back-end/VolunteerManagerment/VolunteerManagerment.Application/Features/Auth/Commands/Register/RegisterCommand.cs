using MediatR;
using VolunteerManagerment.Application.Features.Auth.DTOs;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Register;

public record RegisterCommands(
    string Username,
    string Email,
    string Password,
    Guid OrganizationId
//string Name
) : IRequest<RegisterResponseDto>;
