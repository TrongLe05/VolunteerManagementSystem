using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Activities.Commands.ReviewActivityRegistration;

public class ReviewActivityRegistrationHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IActivityRegistrationRepository activityRegistrationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<ReviewActivityRegistrationCommand, bool>
{
    public async Task<bool> Handle(ReviewActivityRegistrationCommand request, CancellationToken cancellationToken)
    {
        var registration = await activityRegistrationRepository.GetByIdWithDetailsAsync(request.RegistrationId, cancellationToken)
            ?? throw new KeyNotFoundException("Đơn đăng ký hoạt động không tồn tại.");

        var userId = currentUserService.UserId 
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Người dùng không tồn tại.");
        
        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        if (roles.Contains("SUPER_ADMIN"))
        {
            // SUPER_ADMIN can review any registration
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(registration.Activity.Campaign.OrganizationId))
                throw new UnauthorizedAccessException("Bạn không có quyền duyệt đơn đăng ký này.");
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền duyệt đơn đăng ký này.");
        }

        if (registration.Status == "CANCELLED")
            throw new InvalidOperationException("Tình nguyện viên đã huỷ đơn đăng ký này, không thể duyệt.");

        if (registration.Activity.Status is "COMPLETED" or "CANCELLED")
            throw new InvalidOperationException("Hoạt động đã kết thúc hoặc bị huỷ, không thể duyệt đơn đăng ký.");

        registration.Status = request.Status;
        registration.ApprovedBy = userId;
        registration.ApprovedAt = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
