using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Dashboard.DTOs;

namespace VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardSummary;

public class GetDashboardSummaryQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetDashboardSummaryQuery, DashboardSummaryDto>
{
    public async Task<DashboardSummaryDto> Handle(GetDashboardSummaryQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        List<Guid>? allowedOrgs = null;

        if (roles.Contains("SUPER_ADMIN"))
        {
            allowedOrgs = null;
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập thống kê quản trị.");
        }

        // thống kê tổ chức đang hoạt động
        var orgQuery = context.Organizations.AsNoTracking().Where(o => o.IsActive);
        if (allowedOrgs is not null)
        {
            orgQuery = orgQuery.Where(o => allowedOrgs.Contains(o.Id));
        }
        var totalOrganizations = await orgQuery.CountAsync(cancellationToken);

        // thống kê chiến dịch
        var campaignQuery = context.Campaigns.AsNoTracking();
        if (allowedOrgs is not null)
        {
            campaignQuery = campaignQuery.Where(c => allowedOrgs.Contains(c.OrganizationId));
        }

        var totalCampaigns = await campaignQuery.CountAsync(cancellationToken);
        var activeCampaigns = await campaignQuery.CountAsync(c => c.Status == "ONGOING" || c.Status == "UPCOMING", cancellationToken);

        // thống kê hoạt động
        var activityQuery = context.Activities.AsNoTracking();
        if (allowedOrgs is not null)
        {
            activityQuery = activityQuery.Where(a => allowedOrgs.Contains(a.Campaign.OrganizationId));
        }
        var totalActivities = await activityQuery.CountAsync(cancellationToken);
        var openOrOngoingActivities = await activityQuery.CountAsync(a => a.Status == "OPEN" || a.Status == "ONGOING", cancellationToken);

        // thống kê tình nguyện viên
        var volunteersQuery = context.Volunteers.AsNoTracking().Where(v => v.IsActive);
        if (allowedOrgs is not null)
        {
            volunteersQuery = volunteersQuery.Where(v => allowedOrgs.Contains(v.OrganizationId));
        }
        var totalVolunteers = await volunteersQuery.CountAsync(cancellationToken);

        // tổng số đơn đăng ký đang chờ duyệt
        var pendingRegQuery = context.ActivityRegistrations.AsNoTracking()
            .Where(ar => ar.Status == "REGISTERED" && (ar.Activity.Status == "OPEN" || ar.Activity.Status == "ONGOING"));
        if (allowedOrgs is not null)
        {
            pendingRegQuery = pendingRegQuery.Where(ar => allowedOrgs.Contains(ar.Activity.Campaign.OrganizationId));
        }
        var totalPendingRegistrations = await pendingRegQuery.CountAsync(cancellationToken);

        return new DashboardSummaryDto(
            TotalOrganizations: totalOrganizations,
            TotalCampaigns: totalCampaigns,
            ActiveCampaigns: activeCampaigns,
            TotalActivities: totalActivities,
            OpenOrOngoingActivities: openOrOngoingActivities,
            TotalVolunteers: totalVolunteers,
            TotalPendingRegistrations: totalPendingRegistrations
        );
    }
}
