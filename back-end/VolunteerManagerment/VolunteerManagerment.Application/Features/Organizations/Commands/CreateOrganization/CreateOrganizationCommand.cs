using MediatR;

namespace VolunteerManagerment.Application.Features.Organizations.Commands.CreateOrganization;

public record CreateOrganizationCommand(
    Guid? ParentId,
    string Code,
    string Name,
    string? Description
) : IRequest<Guid>;