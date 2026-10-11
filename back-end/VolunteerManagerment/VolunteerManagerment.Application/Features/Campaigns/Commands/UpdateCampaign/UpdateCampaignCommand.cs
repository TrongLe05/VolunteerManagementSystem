using MediatR;

namespace VolunteerManagerment.Application.Features.Campaigns.Commands.UpdateCampaign;

public record UpdateCampaignCommand(
    Guid Id,
    string Name,
    string? Description,
    DateOnly StartDate,
    DateOnly EndDate,
    string Status
) : IRequest<bool>;
