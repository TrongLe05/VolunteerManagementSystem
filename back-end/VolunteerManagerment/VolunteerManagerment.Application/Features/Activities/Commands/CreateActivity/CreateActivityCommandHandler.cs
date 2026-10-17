using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Activities.Commands.CreateActivity;

public class CreateActivityCommandHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IActivityRepository activityRepository,
    ICampaignRepository campaignRepository,
    IOrganizationRepository organizationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateActivityCommand, Guid>
{
    public async Task<Guid> Handle(CreateActivityCommand request, CancellationToken cancellationToken)
    {
        var campaign = await campaignRepository.GetByIdAsync(request.CampaignId, cancellationToken)
            ?? throw new KeyNotFoundException("Chiến dịch Không tồn tại.");

        if (campaign.Status is "COMPLETED" or "CANCELLED")
            throw new InvalidOperationException("Không thể tạo hoạt động cho chiến dịch đã hoàn thành hoặc bị hủy.");

        var userId = currentUserService.UserId 
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");
        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        if (roles.Contains("SUPER_ADMIN"))
        {
            // SUPER_ADMIN can create activities
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken)
                ?? throw new UnauthorizedAccessException("Tổ chức không tồn tại.");
            if (!allowedOrgs.Contains(campaign.OrganizationId))
                throw new UnauthorizedAccessException("Người dùng không có quyền tạo hoạt động cho chiến dịch này.");
        }
        else
        {
            throw new UnauthorizedAccessException("Người dùng không có quyền tạo hoạt động.");
        }

        var actStartDate = DateOnly.FromDateTime(request.StartTime.Date);
        var actEndDate = DateOnly.FromDateTime(request.EndTime.Date);

        if (actStartDate < campaign.StartDate || actEndDate > campaign.EndDate)
            throw new InvalidOperationException("Thời gian hoạt động phải nằm trong khoảng thời gian của chiến dịch.");

        var newActivity = new Activity { 
            Id = Guid.NewGuid(),
            CampaignId = request.CampaignId,
            Name = request.Name,
            Description = request.Description,
            StartTime = request.StartTime.ToUniversalTime(),
            EndTime = request.EndTime.ToUniversalTime(),
            Capacity = request.Capacity,
            CreditHours = request.CreditHours,
            CreditDays = request.CreditDays,
            Status = "DRAFT",
            CreatedBy = userId,
            CreatedAt = DateTimeOffset.UtcNow,
            Locations = []
        };

        foreach (var l in request.Locations)
        {
            newActivity.Locations.Add(new ActivityLocation
            {
                Id = Guid.NewGuid(),
                Name = l.Name.Trim(),
                ActivityId = newActivity.Id,
                Address = l.Address,
                Latitude = l.Latitude,
                Longitude = l.Longitude,
                AllowedRadiusMeters = l.AllowedRadiusMeters,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }                 

        await activityRepository.AddAsync(newActivity, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return newActivity.Id;
    }
}
