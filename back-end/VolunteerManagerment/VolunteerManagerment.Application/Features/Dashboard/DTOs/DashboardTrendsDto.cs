namespace VolunteerManagerment.Application.Features.Dashboard.DTOsl;

public record DashboardTrendsDto(
    List<string> Labels,
    List<int> ActivityCounts,
    List<int> RegistrationCounts
);
