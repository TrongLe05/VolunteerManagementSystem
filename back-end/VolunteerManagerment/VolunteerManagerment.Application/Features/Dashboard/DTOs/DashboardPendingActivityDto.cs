namespace VolunteerManagerment.Application.Features.Dashboard.DTOs;

public record DashboardPendingActivityDto(
    Guid ActivityId,
    string ActivityName,
    string CampaignName,
    string OrganizationName,
    DateTimeOffset StartTime,
    string Status,
    int PendingRegistrationCount,
    int ApprovedRegistrationCount,
    int? Capacity
);
