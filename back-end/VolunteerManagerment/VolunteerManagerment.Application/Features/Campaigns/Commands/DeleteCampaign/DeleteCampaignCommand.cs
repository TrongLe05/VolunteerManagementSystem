using MediatR;

namespace VolunteerManagerment.Application.Features.Campaigns.Commands.DeleteCampaign;

public record DeleteCampaignCommand(Guid Id) : IRequest<bool>;
