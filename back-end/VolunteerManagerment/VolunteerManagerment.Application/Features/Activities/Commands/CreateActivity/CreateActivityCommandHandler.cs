using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Activities.Commands.CreateActivity;

public class CreateActivityCommandHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IActivityRepository activityRepository,
    ICampaignRepository campaignRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateActivityCommand, Guid>
{
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);

    public async Task<Guid> Handle(CreateActivityCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng hiện tại.");
        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var campaign = await campaignRepository.GetByIdAsync(request.CampaignId, cancellationToken)
            ?? throw new KeyNotFoundException("Chiến dịch không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (roles.Contains("SUPER_ADMIN"))
        {
            // Super admin can create activities in any campaign
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(campaign.OrganizationId))
                throw new InvalidOperationException("Bạn không có quyền tạo hoạt động cho chiến dịch thuộc tổ chức này.");
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền tạo hoạt động.");
        }

        if (campaign.Status is "COMPLETED" or "CANCELLED")
            throw new InvalidOperationException("Không thể thêm hoạt động vào chiến dịch đã kết thúc hoặc đã bị hủy.");

        var actStartDate = DateOnly.FromDateTime(request.StartTime.ToOffset(VietnamOffset).DateTime);
        var actEndDate = DateOnly.FromDateTime(request.EndTime.ToOffset(VietnamOffset).DateTime);
        if (actStartDate < campaign.StartDate || actEndDate > campaign.EndDate)
            throw new InvalidOperationException($"Thời gian hoạt động phải nằm trong khoảng thời gian của chiến dịch ({campaign.StartDate:dd/MM/yyyy} - {campaign.EndDate:dd/MM/yyyy}).");

        var newActivity = new Activity
        {
            Id = Guid.NewGuid(),
            CampaignId = request.CampaignId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            StartTime = request.StartTime.ToUniversalTime(),
            EndTime = request.EndTime.ToUniversalTime(),
            Capacity = request.Capacity,
            CreditHours = request.CreditHours,
            CreditDays = request.CreditDays,
            Status = "OPEN",
            CreatedBy = userId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            Locations = request.Locations?.Select(loc => new ActivityLocation
            {
                Id = Guid.NewGuid(),
                Name = loc.Name.Trim(),
                Address = loc.Address?.Trim(),
                Latitude = loc.Latitude,
                Longitude = loc.Longitude,
                AllowedRadiusMeters = loc.AllowedRadiusMeters,
                CreatedAt = DateTimeOffset.UtcNow
            }).ToList() ?? []
        };

        await activityRepository.AddAsync(newActivity, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return newActivity.Id;
    }
}
