namespace VolunteerManagerment.Application.Features.Dashboard.DTOs;

public record DashboardScheduleEventDto(
    Guid Id,
    string Time,
    string Title,
    string Place,
    string Status,
    string OrganizationName,
    string CampaignName,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    string Session
);

public record DashboardScheduleDayDto(
    string Id,
    string Label,
    string Date,
    bool Today,
    bool Past,
    bool Weekend,
    List<DashboardScheduleEventDto> Events
);

public record DashboardScheduleDto(
    string RangeLabel,
    DateTimeOffset WeekStart,
    DateTimeOffset WeekEnd,
    List<DashboardScheduleDayDto> Days
);
