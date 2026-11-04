using FluentAssertions;
using Microsoft.AspNetCore.SignalR;
using Moq;
using VolunteerManagerment.API.Hubs;
using VolunteerManagerment.API.Services;

namespace VolunteerManagerment.Tests.Api;

public class DashboardNotificationServiceIntegrationTests
{
    private readonly Mock<IHubContext<DashboardHub>> _hubContextMock;
    private readonly Mock<IHubClients> _hubClientsMock;
    private readonly Mock<IClientProxy> _clientProxyMock;
    private readonly DashboardNotificationService _service;

    public DashboardNotificationServiceIntegrationTests()
    {
        _hubContextMock = new Mock<IHubContext<DashboardHub>>();
        _hubClientsMock = new Mock<IHubClients>();
        _clientProxyMock = new Mock<IClientProxy>();

        _hubClientsMock.Setup(c => c.All).Returns(_clientProxyMock.Object);
        _hubContextMock.Setup(h => h.Clients).Returns(_hubClientsMock.Object);

        _service = new DashboardNotificationService(_hubContextMock.Object);
    }

    [Fact]
    public async Task NotifyActivityChangedAsync_ShouldBroadcastActivityChangedEventToAllClients()
    {
        await _service.NotifyActivityChangedAsync(CancellationToken.None);

        _clientProxyMock.Verify(
            c => c.SendCoreAsync("ActivityChanged", It.Is<object?[]>(args => args.Length == 0), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyCampaignChangedAsync_ShouldBroadcastCampaignChangedEventToAllClients()
    {
        await _service.NotifyCampaignChangedAsync(CancellationToken.None);

        _clientProxyMock.Verify(
            c => c.SendCoreAsync("CampaignChanged", It.Is<object?[]>(args => args.Length == 0), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyOrganizationChangedAsync_ShouldBroadcastOrganizationChangedEventToAllClients()
    {
        await _service.NotifyOrganizationChangedAsync(CancellationToken.None);

        _clientProxyMock.Verify(
            c => c.SendCoreAsync("OrganizationChanged", It.Is<object?[]>(args => args.Length == 0), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task NotifyVolunteerChangedAsync_ShouldBroadcastVolunteerChangedEventToAllClients()
    {
        await _service.NotifyVolunteerChangedAsync(CancellationToken.None);

        _clientProxyMock.Verify(
            c => c.SendCoreAsync("VolunteerChanged", It.Is<object?[]>(args => args.Length == 0), It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
