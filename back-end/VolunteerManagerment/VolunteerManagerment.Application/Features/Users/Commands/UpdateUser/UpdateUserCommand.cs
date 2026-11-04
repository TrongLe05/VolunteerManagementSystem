using MediatR;

namespace VolunteerManagerment.Application.Features.Users.Commands.UpdateUser;

public record UpdateUserCommand(
    Guid Id,
    string Email,
    Guid OrganizationId,
    List<string> RoleCodes,
    bool IsActive,
    string? FullName = null,
    string? StudentCode = null,
    string? Phone = null
) : IRequest<bool>;
