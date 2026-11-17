using MediatR;
using VolunteerManagerment.Application.Features.Auth.DTOs;

namespace VolunteerManagerment.Application.Features.Auth.Commands.GoogleLogin;

public record GoogleLoginCommand(
    string IdToken, 
    Guid? OrganizationId = null
) : IRequest<GoogleLoginResponseDto>;
