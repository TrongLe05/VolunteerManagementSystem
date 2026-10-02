using MediatR;

namespace VolunteerManagerment.Application.Features.Organizations.Commands.UpdateOrganization;

public record UpdateOrganizationCommand(
    Guid Id,
    Guid? ParentId,
    string Code,
    string Name,
    string? Description,
    bool IsActive
) : IRequest<bool>;