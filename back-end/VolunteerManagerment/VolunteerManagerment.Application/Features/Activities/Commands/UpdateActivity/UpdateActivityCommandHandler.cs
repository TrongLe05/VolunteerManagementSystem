using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Activities.Commands.UpdateActivity;

public class UpdateActivityCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IActivityRepository activityRepository,
    IOrganizationRepository organizationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateActivityCommand, bool>
{
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);

    public async Task<bool> Handle(UpdateActivityCommand request, CancellationToken cancellationToken)
    {
        var activity = await activityRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Hoạt động không tồn tại.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không thể xác định người dùng hiện tại.");
        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng hiện tại không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (roles.Contains("SUPER_ADMIN"))
        {
            // Super admin can update any activity
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(activity.Campaign.OrganizationId))
                throw new InvalidOperationException("Bạn không có quyền chỉnh sửa hoạt động của đơn vị này.");
        }
        else
        {
            throw new UnauthorizedAccessException("Người dùng hiện tại không có quyền chỉnh sửa hoạt động này.");
        }

        var actStartDate = DateOnly.FromDateTime(request.StartTime.ToOffset(VietnamOffset).DateTime);
        var actEndDate = DateOnly.FromDateTime(request.EndTime.ToOffset(VietnamOffset).DateTime);

        if (actStartDate < activity.Campaign.StartDate || actEndDate > activity.Campaign.EndDate)
            throw new InvalidOperationException($"Thời gian hoạt động phải nằm trong khoảng thời gian của chiến dịch ({activity.Campaign.StartDate:dd/MM/yyyy} - {activity.Campaign.EndDate:dd/MM/yyyy}).");

        activity.Name = request.Name.Trim();
        activity.Description = request.Description?.Trim();
        activity.StartTime = request.StartTime.ToUniversalTime();
        activity.EndTime = request.EndTime.ToUniversalTime();
        activity.Capacity = request.Capacity;
        activity.CreditDays = request.CreditDays;

        var now = DateTimeOffset.UtcNow;
        // Tự động suy luận trạng thái chuẩn xác theo thời gian thực (trừ khi cố tình để DRAFT hoặc CANCELLED)
        if (request.Status is not ("DRAFT" or "CANCELLED"))
        {
            if (activity.EndTime <= now)
            {
                activity.Status = "COMPLETED";
            }
            else if (activity.StartTime <= now)
            {
                activity.Status = "ONGOING";
            }
            else
            {
                activity.Status = "OPEN";
            }
        }
        else
        {
            activity.Status = request.Status;
        }

        activity.UpdatedAt = now;

        if (request.Locations is not null)
        {
            if (activity.Locations.Count > 0)
            {
                context.ActivityLocations.RemoveRange(activity.Locations);
            }

            var newLocations = request.Locations.Select(l => new ActivityLocation
            {
                Id = Guid.NewGuid(),
                ActivityId = activity.Id,
                Name = l.Name.Trim(),
                Address = l.Address?.Trim(),
                Latitude = l.Latitude,
                Longitude = l.Longitude,
                AllowedRadiusMeters = l.AllowedRadiusMeters,
                CreatedAt = DateTimeOffset.UtcNow
            }).ToList();

            await context.ActivityLocations.AddRangeAsync(newLocations, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
