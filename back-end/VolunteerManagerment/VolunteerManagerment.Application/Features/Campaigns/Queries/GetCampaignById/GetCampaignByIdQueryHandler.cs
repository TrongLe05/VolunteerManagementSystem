using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Campaigns.DTOs;

namespace VolunteerManagerment.Application.Features.Campaigns.Queries.GetCampaignById;

public class GetCampaignByIdQueryHandler(
    ICampaignRepository campaignRepository,
    IOrganizationRepository organizationRepository,
    ICurrentUserService currentUserService,
    IUserRepository userRepository
) : IRequestHandler<GetCampaignByIdQuery, CampaignDto>
{
    public async Task<CampaignDto> Handle(GetCampaignByIdQuery request, CancellationToken cancellationToken)
    {
        var campaign = await campaignRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Chiến dịch không tồn tại");

        var userId = currentUserService.UserId 
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Người dùng không tồn tại");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if(roles.Contains("SUPER_ADMIN"))
        {
            // SUPER_ADMIN can access any campaign
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(campaign.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập chiến dịch này.");
            }
        }
        else if (roles.Contains("VOLUNTEER"))
        {
            if (campaign.Status == "DRAFT")
                throw new KeyNotFoundException("Không tìm thấy chiến dịch.");
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập.");
        }

        return new CampaignDto(
            campaign.Id,
            campaign.Name,
            campaign.Description,
            campaign.StartDate,
            campaign.EndDate,
            campaign.Status,
            campaign.OrganizationId,
            campaign.Organization?.Name ?? string.Empty,
            campaign.CreatedBy
        );
    }
}
