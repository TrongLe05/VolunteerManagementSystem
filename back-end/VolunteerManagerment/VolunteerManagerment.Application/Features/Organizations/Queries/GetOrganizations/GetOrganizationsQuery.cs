using MediatR;
using VolunteerManagerment.Application.Features.Organizations.DTOs;

namespace VolunteerManagerment.Application.Features.Organizations.Queries.GetOrganizations;

public record GetOrganizationsQuery(string? SearchTerm = null) : IRequest<List<OrganizationDto>>;
