using MediatR;

namespace VolunteerManagerment.Application.Features.Organizations.Commands.DeleteOrganization;

public record DeleteOrganizationCommand(Guid Id) : IRequest<bool>;
