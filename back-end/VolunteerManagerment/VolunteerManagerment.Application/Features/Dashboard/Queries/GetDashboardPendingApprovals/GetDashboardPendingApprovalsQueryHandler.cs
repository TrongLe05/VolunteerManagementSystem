using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Dashboard.DTOs;

namespace VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardPendingApprovals;

public sealed class GetDashboardPendingApprovalsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
)
: IRequestHandler<GetDashboardPendingApprovalsQuery, List<DashboardPendingActivityDto>>
{
    public async Task<List<DashboardPendingActivityDto>> Handle(GetDashboardPendingApprovalsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        List<Guid>? allowedOrgIds = null;
        if (roles.Contains("SUPER_ADMIN"))
        {
            allowedOrgIds = null;
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(
                user.OrganizationId,
                cancellationToken);
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập thống kê quản trị.");
        }

        var limit = request.Limit is <= 0 or > 50 ? 5 : request.Limit;

        var activitiesQuery = context.Activities
            .AsNoTracking()
            .Where(a => a.Status == "OPEN" || a.Status == "ONGOING");

        if (allowedOrgIds != null)
        {
            activitiesQuery = activitiesQuery
                .Where(a => allowedOrgIds.Contains(a.Campaign.OrganizationId));
        }

        var items = await activitiesQuery
            .Select(a => new
            {
                ActivityId = a.Id,
                ActivityName = a.Name,
                CampaignName = a.Campaign.Name,
                OrganizationName = a.Campaign.Organization.Name,
                a.StartTime,
                a.Status,
                PendingCount = a.Registrations.Count(r => r.Status == "REGISTERED"),
                ApprovedCount = a.Registrations.Count(r => r.Status == "APPROVED"),
                a.Capacity
            })
            // Chỉ lấy các hoạt động đang thực sự có đơn chờ duyệt (hoặc sắp xếp ưu tiên có đơn chờ duyệt lên đầu)
            .Where(x => x.PendingCount > 0)
            .OrderByDescending(x => x.PendingCount)
            .ThenBy(x => x.StartTime)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return items
            .Select(x => new DashboardPendingActivityDto(
                ActivityId: x.ActivityId,
                ActivityName: x.ActivityName,
                CampaignName: x.CampaignName,
                OrganizationName: x.OrganizationName,
                StartTime: x.StartTime,
                Status: x.Status,
                PendingRegistrationCount: x.PendingCount,
                ApprovedRegistrationCount: x.ApprovedCount,
                Capacity: x.Capacity
            ))
            .ToList();

    }
}
