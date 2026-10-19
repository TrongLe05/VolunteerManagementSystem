using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetMyActivityRegistrations;

public record GetMyActivityRegistrationsQuery(
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PageResult<MyActivityRegistrationDto>>;
