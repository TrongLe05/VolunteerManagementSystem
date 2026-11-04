using Microsoft.AspNetCore.SignalR;

namespace VolunteerManagerment.API.Hubs;

public class DashboardHub : Hub
{
    public const string HubUrl = "/hubs/dashboard";

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
