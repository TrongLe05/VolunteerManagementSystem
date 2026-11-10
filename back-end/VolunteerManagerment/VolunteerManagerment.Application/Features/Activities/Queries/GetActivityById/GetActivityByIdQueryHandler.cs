using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetActivityById;

public class GetActivityByIdQueryHandler(
    IOrganizationRepository organizationRepository,
    IActivityRepository activityRepository,
    IActivityRegistrationRepository activityRegistrationRepository,
    IUserRepository userRepository,
    ICurrentUserService currentUserService
) : IRequestHandler<GetActivityByIdQuery, ActivityDto>
{
    public async Task<ActivityDto> Handle(GetActivityByIdQuery request, CancellationToken cancellationToken)
    {
        var activity = await activityRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Hoạt động không tồn tại.");

        var userId = currentUserService.UserId;
        if (!userId.HasValue)
        {
            if (activity.Status == "DRAFT")
                throw new KeyNotFoundException("Hoạt động không tồn tại.");
        }
        else
        {
            var user = await userRepository.GetByIdWithDetailsAsync(userId.Value, cancellationToken)
                ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");
            var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

            if (roles.Contains("SUPER_ADMIN"))
            {
            }
            else if (roles.Contains("ORGANIZATION_ADMIN"))
            {
                var allowedOrgs = await organizationRepository.GetVisibleOrganizationIdsAsync(user.OrganizationId, cancellationToken);
                if (!allowedOrgs.Contains(activity.Campaign.OrganizationId))
                    throw new KeyNotFoundException("Bạn không thể xem hoạt động ngoài tổ chức của mình quản lý.");
            }
            else if (roles.Contains("VOLUNTEER"))
            {
                if (activity.Status == "DRAFT")
                    throw new KeyNotFoundException("Bạn không thể xem hoạt động đang ở trạng thái nháp.");
            }
            else
            {
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập vào hoạt động này.");
            }
        }

        var registrations = await activityRegistrationRepository.CountActivityRegistrationsAsync(activity.Id, cancellationToken);

        return new ActivityDto(
            activity.Id,
            activity.CampaignId,
            activity.Campaign.Name,
            activity.Campaign.OrganizationId,
            activity.Campaign.Organization.Name,
            activity.Name,
            activity.Description,
            activity.StartTime,
            activity.EndTime,
            activity.Capacity,
            activity.CreditDays,
            activity.Status,
            activity.CreatedBy,
            registrations,
            [
                .. activity.Locations.Select(l => new ActivityLocationDto(
                    l.Id,
                    l.ActivityId,
                    l.Name,
                    l.Address,
                    l.Latitude,
                    l.Longitude,
                    l.AllowedRadiusMeters
                ))
            ]
        );
    }
}
