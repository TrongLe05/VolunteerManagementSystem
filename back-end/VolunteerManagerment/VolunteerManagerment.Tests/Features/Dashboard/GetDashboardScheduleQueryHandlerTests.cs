using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardSchedule;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Dashboard;

public class GetDashboardScheduleQueryHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenSuperAdminRequestsWeekSchedule_ShouldReturn7DaysWithMappedEvents()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var orgId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var role = new Role { Id = Guid.NewGuid(), Code = "SUPER_ADMIN", Name = "Super Admin" };
        var user = new User
        {
            Id = userId,
            OrganizationId = orgId,
            Username = "admin",
            Email = "admin@dthu.edu.vn",
            UserRoles = [new UserRole { UserId = userId, RoleId = role.Id, Role = role }]
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var org = new Organization { Id = orgId, Name = "Đoàn Trường ĐH Đồng Tháp", IsActive = true };
        var campaign = new Campaign { Id = campaignId, Name = "Mùa Hè Xanh", OrganizationId = orgId, Organization = org };

        // Thứ Bảy 21/11/2026 lúc 08:30 (+07:00) -> thuộc tuần 16/11 - 22/11
        var vnOffset = TimeSpan.FromHours(7);
        var activityStart = new DateTimeOffset(2026, 11, 21, 8, 30, 0, vnOffset);
        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            Campaign = campaign,
            Name = "Ra quân vệ sinh môi trường",
            Status = "OPEN",
            StartTime = activityStart,
            EndTime = activityStart.AddHours(3),
            Locations = [new ActivityLocation { Id = Guid.NewGuid(), Name = "Sân trường ĐHĐT", Address = "783 Phạm Hữu Lầu" }]
        };

        // Hoạt động đã huỷ không được xuất hiện
        var cancelledActivity = new Activity
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            Campaign = campaign,
            Name = "Hoạt động đã huỷ",
            Status = "CANCELLED",
            StartTime = activityStart.AddHours(2),
            EndTime = activityStart.AddHours(4)
        };

        context.Organizations.Add(org);
        context.Campaigns.Add(campaign);
        context.Activities.AddRange(activity, cancelledActivity);
        await context.SaveChangesAsync();

        var handler = new GetDashboardScheduleQueryHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object);

        // Act
        var result = await handler.Handle(new GetDashboardScheduleQuery(new DateOnly(2026, 11, 21)), CancellationToken.None);

        // Assert
        result.RangeLabel.Should().Be("16/11 - 22/11");
        result.Days.Should().HaveCount(7);
        result.Days[0].Label.Should().Be("Thứ Hai");
        result.Days[5].Label.Should().Be("Thứ Bảy");
        result.Days[5].Weekend.Should().BeTrue();
        result.Days[5].Events.Should().ContainSingle();

        var evt = result.Days[5].Events[0];
        evt.Title.Should().Be("Ra quân vệ sinh môi trường");
        evt.Time.Should().Be("08:30");
        evt.Place.Should().Be("Sân trường ĐHĐT");
        evt.Session.Should().Be("S");
    }

    [Fact]
    public async Task Handle_WhenOrganizationAdmin_ShouldFilterByAllowedOrganizations()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var allowedOrgId = Guid.NewGuid();
        var otherOrgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var role = new Role { Id = Guid.NewGuid(), Code = "ORGANIZATION_ADMIN", Name = "Org Admin" };
        var user = new User
        {
            Id = userId,
            OrganizationId = allowedOrgId,
            Username = "orgadmin",
            Email = "orgadmin@dthu.edu.vn",
            UserRoles = [new UserRole { UserId = userId, RoleId = role.Id, Role = role }]
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(allowedOrgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([allowedOrgId]);

        var allowedOrg = new Organization { Id = allowedOrgId, Name = "Liên Chi đoàn CNTT", IsActive = true };
        var otherOrg = new Organization { Id = otherOrgId, Name = "Liên Chi đoàn Kinh tế", IsActive = true };

        var allowedCampaign = new Campaign { Id = Guid.NewGuid(), Name = "Chiến dịch CNTT", OrganizationId = allowedOrgId, Organization = allowedOrg };
        var otherCampaign = new Campaign { Id = Guid.NewGuid(), Name = "Chiến dịch Kinh tế", OrganizationId = otherOrgId, Organization = otherOrg };

        var vnOffset = TimeSpan.FromHours(7);
        var start = new DateTimeOffset(2026, 11, 18, 14, 0, 0, vnOffset); // Thứ Tư 18/11/2026

        context.Organizations.AddRange(allowedOrg, otherOrg);
        context.Campaigns.AddRange(allowedCampaign, otherCampaign);
        context.Activities.AddRange(
            new Activity
            {
                Id = Guid.NewGuid(),
                CampaignId = allowedCampaign.Id,
                Campaign = allowedCampaign,
                Name = "Hỗ trợ tin học",
                Status = "OPEN",
                StartTime = start,
                EndTime = start.AddHours(2)
            },
            new Activity
            {
                Id = Guid.NewGuid(),
                CampaignId = otherCampaign.Id,
                Campaign = otherCampaign,
                Name = "Hội thảo Kinh tế",
                Status = "OPEN",
                StartTime = start,
                EndTime = start.AddHours(2)
            });
        await context.SaveChangesAsync();

        var handler = new GetDashboardScheduleQueryHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object);

        // Act
        var result = await handler.Handle(new GetDashboardScheduleQuery(new DateOnly(2026, 11, 18)), CancellationToken.None);

        // Assert
        var wednesday = result.Days[2];
        wednesday.Label.Should().Be("Thứ Tư");
        wednesday.Events.Should().ContainSingle();
        wednesday.Events[0].Title.Should().Be("Hỗ trợ tin học");
        wednesday.Events[0].Session.Should().Be("C");
        wednesday.Events[0].Place.Should().Be("Liên Chi đoàn CNTT");
    }
}
