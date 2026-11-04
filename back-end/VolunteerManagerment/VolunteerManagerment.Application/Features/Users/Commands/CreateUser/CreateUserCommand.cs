using MediatR;

namespace VolunteerManagerment.Application.Features.Users.Commands.CreateUser;

public record CreateUserCommand(
    string Username,
    string Email,
    string Password,
    Guid OrganizationId,
    List<string> RoleCodes,
    bool IsActive = true,
    string? FullName = null,
    string? StudentCode = null,
    string? Phone = null
) : IRequest<Guid>;
