using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetAdminActivities;

public record GetAdminActivitiesQuery(
    string? SearchTerm = null,
    Guid? OrganizationId = null,
    Guid? CampaignId = null,
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PageResult<ActivityDto>>;
