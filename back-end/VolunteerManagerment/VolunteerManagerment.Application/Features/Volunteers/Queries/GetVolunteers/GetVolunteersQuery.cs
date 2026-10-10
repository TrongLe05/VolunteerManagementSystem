using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetVolunteers;

public record GetVolunteersQuery(
    string? SearchTerm = null,
    Guid? OrganizationId = null,
    bool? IsActive = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PageResult<VolunteerDto>>;
