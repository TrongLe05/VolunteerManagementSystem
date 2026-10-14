using MediatR;
using VolunteerManagerment.Application.Features.Organizations.DTOs;

namespace VolunteerManagerment.Application.Features.Organizations.Queries.GetOrganizationById;

public record GetOrganizationByIdQuery(Guid Id) : IRequest<OrganizationDto>;
