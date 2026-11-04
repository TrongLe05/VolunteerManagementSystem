namespace VolunteerManagerment.Application.Common.Interfaces;

public interface IDashboardNotificationService
{
    Task NotifyActivityChangedAsync(CancellationToken cancellationToken = default);
    Task NotifyCampaignChangedAsync(CancellationToken cancellationToken = default);
    Task NotifyOrganizationChangedAsync(CancellationToken cancellationToken = default);
    Task NotifyVolunteerChangedAsync(CancellationToken cancellationToken = default);
}
