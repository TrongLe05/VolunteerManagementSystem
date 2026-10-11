using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Campaigns.Commands.DeleteCampaign;

public class DeleteCampaignCommandHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    ICampaignRepository campaignRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<DeleteCampaignCommand, bool>
{
    public async Task<bool> Handle(DeleteCampaignCommand request, CancellationToken cancellationToken)
    {
        var campaign = await campaignRepository.GetByIdAsync(request.Id) 
            ?? throw new KeyNotFoundException("Chiến dịch không tồn tại.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (roles.Contains("SUPER_ADMIN"))
        {
            
        }   
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(campaign.OrganizationId))
                throw new UnauthorizedAccessException("Người dùng không có quyền xóa chiến dịch này.");
        }
        else
        {
            throw new UnauthorizedAccessException("Người dùng không có quyền xóa chiến dịch.");
        }

        if (campaign.Status != "DRAFT")
            throw new InvalidOperationException("Chỉ có thể xoá chiến dịch khi trạng thái là nháp (DRAFT).");

        campaignRepository.Delete(campaign);
        await unitOfWork.SaveChangesAsync(cancellationToken);
         
        return true;
    }
}
