using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Dashboard.DTOs;

namespace VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardSchedule;

public sealed class GetDashboardScheduleQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetDashboardScheduleQuery, DashboardScheduleDto>
{
    private static readonly TimeSpan VietnamOffset = TimeSpan.FromHours(7);
    private static readonly string[] DayLabels =
    [
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
        "Chủ Nhật"
    ];

    public async Task<DashboardScheduleDto> Handle(
        GetDashboardScheduleQuery request,
        CancellationToken cancellationToken)
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

        var nowVn = DateTimeOffset.UtcNow.ToOffset(VietnamOffset);
        var todayVnDate = DateOnly.FromDateTime(nowVn.Date);
        var targetDate = request.Date ?? todayVnDate;

        var dayOfWeek = (int)targetDate.DayOfWeek; // Sunday = 0, Monday = 1 ...
        var diffToMonday = dayOfWeek == 0 ? -6 : 1 - dayOfWeek;
        var mondayDate = targetDate.AddDays(diffToMonday);
        var sundayDate = mondayDate.AddDays(6);

        var weekStart = new DateTimeOffset(mondayDate.ToDateTime(TimeOnly.MinValue), VietnamOffset);
        var nextWeekStart = weekStart.AddDays(7);
        var weekEnd = nextWeekStart.AddTicks(-1);

        var activitiesQuery = context.Activities
            .AsNoTracking()
            .Where(a => a.Status != "CANCELLED" &&
                        a.StartTime >= weekStart &&
                        a.StartTime < nextWeekStart);

        if (allowedOrgIds is not null)
        {
            activitiesQuery = activitiesQuery
                .Where(a => allowedOrgIds.Contains(a.Campaign.OrganizationId));
        }

        var activities = await activitiesQuery
            .OrderBy(a => a.StartTime)
            .Select(a => new
            {
                a.Id,
                a.Name,
                a.Status,
                a.StartTime,
                a.EndTime,
                CampaignName = a.Campaign.Name,
                OrganizationName = a.Campaign.Organization.Name,
                PrimaryLocationName = a.Locations
                    .Select(l => l.Name)
                    .FirstOrDefault(),
                PrimaryLocationAddress = a.Locations
                    .Select(l => l.Address)
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var days = new List<DashboardScheduleDayDto>(7);

        for (var i = 0; i < 7; i++)
        {
            var currentDate = mondayDate.AddDays(i);
            var isToday = currentDate == todayVnDate;
            var isPast = currentDate < todayVnDate;

            var dayEvents = activities
                .Where(a => DateOnly.FromDateTime(a.StartTime.ToOffset(VietnamOffset).Date) == currentDate)
                .Select(a =>
                {
                    var localStart = a.StartTime.ToOffset(VietnamOffset);
                    var place = !string.IsNullOrWhiteSpace(a.PrimaryLocationName)
                        ? a.PrimaryLocationName
                        : (!string.IsNullOrWhiteSpace(a.PrimaryLocationAddress)
                            ? a.PrimaryLocationAddress
                            : a.OrganizationName);

                    return new DashboardScheduleEventDto(
                        Id: a.Id,
                        Time: localStart.ToString("HH:mm"),
                        Title: a.Name,
                        Place: place,
                        Status: a.Status,
                        OrganizationName: a.OrganizationName,
                        CampaignName: a.CampaignName,
                        StartTime: a.StartTime,
                        EndTime: a.EndTime,
                        Session: localStart.Hour < 12 ? "S" : "C"
                    );
                })
                .ToList();

            days.Add(new DashboardScheduleDayDto(
                Id: $"day-{i}",
                Label: DayLabels[i],
                Date: currentDate.ToString("dd/MM"),
                Today: isToday,
                Past: isPast,
                Weekend: i >= 5,
                Events: dayEvents
            ));
        }

        var rangeLabel = $"{mondayDate:dd/MM} - {sundayDate:dd/MM}";

        return new DashboardScheduleDto(
            RangeLabel: rangeLabel,
            WeekStart: weekStart,
            WeekEnd: weekEnd,
            Days: days
        );
    }
}
