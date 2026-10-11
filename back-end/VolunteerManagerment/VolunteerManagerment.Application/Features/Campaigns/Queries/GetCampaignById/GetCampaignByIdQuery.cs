using MediatR;
using VolunteerManagerment.Application.Features.Campaigns.DTOs;

namespace VolunteerManagerment.Application.Features.Campaigns.Queries.GetCampaignById;

public record GetCampaignByIdQuery(Guid Id) : IRequest<CampaignDto>;
