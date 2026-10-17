using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Activities.Commands.UpdateActivity;

public class UpdateActivityCommandHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IActivityRepository activityRepository,
    IOrganizationRepository organizationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateActivityCommand, bool>
{
    public async Task<bool> Handle(UpdateActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = await activityRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Hoạt động không tồn tại.");

        if (activity.Status is "COMPLETED" or "CANCELLED")
            throw new InvalidOperationException("Không thể chỉnh sửa hoạt động đã kết thúc hoặc đã bị hủy.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không thể xác định người dùng hiện tại.");
        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng hiện tại không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (roles.Contains("SUPER_ADMIN"))
        {

        } 
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(activity.Campaign.OrganizationId))
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa hoạt động của đơn vị này.");
        }
        else
        {
            throw new UnauthorizedAccessException("Người dùng hiện tại không có quyền chỉnh sửa hoạt động này.");
        }

        var actStartDate = DateOnly.FromDateTime(request.StartTime.DateTime);
        var actEndDate = DateOnly.FromDateTime(request.EndTime.DateTime);

        if (actStartDate < activity.Campaign.StartDate || actEndDate > activity.Campaign.EndDate)
            throw new InvalidOperationException("Thời gian hoạt động phải nằm trong khoảng thời gian của chiến dịch.");

        activity.Name = request.Name;
        activity.Description = request.Description?.Trim();
        activity.StartTime = request.StartTime.ToUniversalTime();
        activity.EndTime = request.EndTime.ToUniversalTime();
        activity.Capacity = request.Capacity;
        activity.CreditHours = request.CreditHours;
        activity.CreditDays = request.CreditDays;
        activity.Status = request.Status;
        activity.UpdatedAt = DateTimeOffset.UtcNow;

        if (request.Locations is not null)
        {
            activity.Locations.Clear();
            foreach (var l in request.Locations)
            {
                activity.Locations.Add(new ActivityLocation
                {
                    Id = Guid.Empty,
                    ActivityId = activity.Id,
                    Name = l.Name,
                    Address = l.Address,
                    Latitude = l.Latitude,
                    Longitude = l.Longitude,
                    AllowedRadiusMeters = l.AllowedRadiusMeters,
                });
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
