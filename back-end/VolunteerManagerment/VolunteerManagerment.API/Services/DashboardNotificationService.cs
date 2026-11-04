using Microsoft.AspNetCore.SignalR;
using VolunteerManagerment.API.Hubs;
using VolunteerManagerment.Application.Common.Interfaces;

namespace VolunteerManagerment.API.Services;

public class DashboardNotificationService(IHubContext<DashboardHub> hubContext) : IDashboardNotificationService
{
    public async Task NotifyActivityChangedAsync(CancellationToken cancellationToken = default)
    {
        await hubContext.Clients.All.SendAsync("ActivityChanged", cancellationToken);
    }

    public async Task NotifyCampaignChangedAsync(CancellationToken cancellationToken = default)
    {
        await hubContext.Clients.All.SendAsync("CampaignChanged", cancellationToken);
    }

    public async Task NotifyOrganizationChangedAsync(CancellationToken cancellationToken = default)
    {
        await hubContext.Clients.All.SendAsync("OrganizationChanged", cancellationToken);
    }

    public async Task NotifyVolunteerChangedAsync(CancellationToken cancellationToken = default)
    {
        await hubContext.Clients.All.SendAsync("VolunteerChanged", cancellationToken);
    }
}
