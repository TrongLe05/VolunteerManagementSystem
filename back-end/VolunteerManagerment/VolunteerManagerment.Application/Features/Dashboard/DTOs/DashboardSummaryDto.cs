namespace VolunteerManagerment.Application.Features.Dashboard.DTOs;

public record DashboardSummaryDto(
    int TotalOrganizations,
    int TotalCampaigns,
    int ActiveCampaigns,
    int TotalActivities,
    int OpenOrOngoingActivities,
    int TotalVolunteers,
    int TotalPendingRegistrations
);