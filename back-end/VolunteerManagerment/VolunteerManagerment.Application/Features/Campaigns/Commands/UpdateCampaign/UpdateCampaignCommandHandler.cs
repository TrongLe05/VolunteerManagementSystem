using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Campaigns.Commands.UpdateCampaign;

public class UpdateCampaignCommandHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    ICampaignRepository campaignRepository,
    IOrganizationRepository organizationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateCampaignCommand, bool>
{
    public async Task<bool> Handle(UpdateCampaignCommand request, CancellationToken cancellationToken)
    {
        var campaign = await campaignRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Chiến dịch không tồn tại.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (roles.Contains("SUPER_ADMIN"))
        {
            // Super admin can update any campaign
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(campaign.OrganizationId))
            {
                throw new UnauthorizedAccessException("Người dùng không có quyền cập nhật chiến dịch.");
            }
        }
        else
        {
            throw new UnauthorizedAccessException("Người dùng không có quyền cập nhật chiến dịch.");
        }

        if (campaign.Status is "COMPLETED" or "CANCELLED")
            throw new InvalidOperationException("Không thể cập nhật chiến dịch đã kết thúc hoặc đã hủy.");

        campaign.Name = request.Name;
        campaign.Description = request.Description?.Trim();
        campaign.StartDate = request.StartDate;
        campaign.EndDate = request.EndDate;
        campaign.Status = request.Status;
        campaign.UpdatedAt = DateTime.UtcNow;

        campaignRepository.Update(campaign);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
