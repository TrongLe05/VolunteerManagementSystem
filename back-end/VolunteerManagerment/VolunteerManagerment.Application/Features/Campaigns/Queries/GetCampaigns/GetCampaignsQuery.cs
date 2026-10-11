using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Campaigns.DTOs;

namespace VolunteerManagerment.Application.Features.Campaigns.Queries.GetCampaigns;

public record GetCampaignsQuery(
    string? SearchTerm,
    Guid? OrganizationId,
    string? Status = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PageResult<CampaignDto>>;
