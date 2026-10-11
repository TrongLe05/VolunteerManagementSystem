using MediatR;

namespace VolunteerManagerment.Application.Features.Campaigns.Commands.CreateCampaign;

public record CreateCampaignCommand (
    Guid OrganizationId,
    string Name,
    string? Description,
    DateOnly StartDate,
    DateOnly EndDate
) : IRequest<Guid>;