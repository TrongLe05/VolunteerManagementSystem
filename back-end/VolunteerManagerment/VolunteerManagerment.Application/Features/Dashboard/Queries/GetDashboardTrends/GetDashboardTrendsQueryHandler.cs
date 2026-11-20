using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Dashboard.DTOsl;

namespace VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardTrends;

public sealed class GetDashboardTrendsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetDashboardTrendsQuery, DashboardTrendsDto>
{
    public async Task<DashboardTrendsDto> Handle(GetDashboardTrendsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
                ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        List<Guid>? allowedOrg = null;
        if (roles.Contains("SUPER_ADMIN"))
        {
            allowedOrg = null;
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            allowedOrg = await organizationRepository.GetSubOrganizationIdsAsync(
                user.OrganizationId,
                cancellationToken);
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập thống kê quản trị.");
        }

        // giới hạn số tháng hợp lệ từ 1 đến 24 tháng (mặc định 6 tháng)
        int monthsCount = request.Months is <= 0 or > 24 ? 6 : request.Months;

        var now = DateTimeOffset.UtcNow;
        var currentMonthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, now.Offset);
        var fromDate = currentMonthStart.AddMonths(-(monthsCount - 1));
        var toDate = currentMonthStart.AddMonths(1);

        // 1. Lấy danh sách thời điểm bắt đầu các Hoạt động trong khoảng thời gian
        var activitiesQuery = context.Activities
            .AsNoTracking()
            .Where(a => a.Status != "CANCELLED" &&
                        a.StartTime >= fromDate &&
                        a.StartTime < toDate);

        if (allowedOrg is not null)
        {
            activitiesQuery = activitiesQuery
                .Where(a => allowedOrg.Contains(a.Campaign.OrganizationId));
        }

        var activityDates = await activitiesQuery
            .Select(a => a.StartTime)
            .ToListAsync(cancellationToken);

        // 2. Lấy danh sách thời điểm Đăng ký của sinh viên trong khoảng thời gian
        var registrationsQuery = context.ActivityRegistrations
            .AsNoTracking()
            .Where(ar => ar.Status != "CANCELLED" &&
                         ar.RegisteredAt >= fromDate &&
                         ar.RegisteredAt < toDate);

        if (allowedOrg is not null)
        {
            registrationsQuery = registrationsQuery
                .Where(ar => allowedOrg.Contains(ar.Activity.Campaign.OrganizationId));
        }

        var registrationDates = await registrationsQuery
            .Select(ar => ar.RegisteredAt)
            .ToListAsync(cancellationToken);

        // 3. Nhóm theo từng tháng và điền 0 cho các tháng không có dữ liệu
        var labels = new List<string>(monthsCount);
        var activityCounts = new List<int>(monthsCount);
        var registrationCounts = new List<int>(monthsCount);

        for (var i = 0; i < monthsCount; i++)
        {
            var monthDate = fromDate.AddMonths(i);
            var year = monthDate.Year;
            var month = monthDate.Month;

            labels.Add($"T{month}");

            var actCount = activityDates.Count(d => d.Year == year && d.Month == month);
            var regCount = registrationDates.Count(d => d.Year == year && d.Month == month);

            activityCounts.Add(actCount);
            registrationCounts.Add(regCount);
        }

        return new DashboardTrendsDto(
            Labels: labels,
            ActivityCounts: activityCounts,
            RegistrationCounts: registrationCounts
        );
    }
}
