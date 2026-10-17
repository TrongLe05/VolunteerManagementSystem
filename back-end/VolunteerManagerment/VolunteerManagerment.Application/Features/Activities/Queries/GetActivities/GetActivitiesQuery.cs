using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetActivities;

public record GetActivitiesQuery(
    string? SearchTerm,
    Guid? OrganizationId,
    Guid? CampaignId,
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PageResult<ActivityDto>>;
