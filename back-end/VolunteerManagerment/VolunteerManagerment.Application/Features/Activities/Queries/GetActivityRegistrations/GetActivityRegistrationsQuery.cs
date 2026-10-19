using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetActivityRegistrations;

public record GetActivityRegistrationsQuery(
    Guid ActivityId,
    string? SearchTerm = null,
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PageResult<ActivityRegistrationDto>>;
