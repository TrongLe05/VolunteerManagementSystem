using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Activities.Commands.DeleteActivity;

public class DeleteActivityCommandHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IActivityRepository activityRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<DeleteActivityCommand, bool>
{
    public async Task<bool> Handle(DeleteActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = await activityRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Hoạt động không tồn tại.");

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
            if (!allowedOrgs.Contains(activity.Campaign.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xóa hoạt động này.");
            }
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa hoạt động này.");
        }

        if (activity.Status is not "DRAFT") 
            throw new InvalidOperationException("Chỉ có thể xóa hoạt động ở trạng thái nháp (DRAFT).");

        activityRepository.Delete(activity);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
