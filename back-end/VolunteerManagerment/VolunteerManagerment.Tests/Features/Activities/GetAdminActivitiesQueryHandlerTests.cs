using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Activities.Queries.GetAdminActivities;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Activities;

public class GetAdminActivitiesQueryHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenOrganizationAdmin_ShouldOnlyReturnActivitiesFromSubOrganizationsIncludingDraft()
    {
        await using var context = CreateInMemoryDbContext();

        var orgA = new Organization { Id = Guid.NewGuid(), Code = "ORG_A", Name = "Khoa CNTT", IsActive = true };
        var orgB = new Organization { Id = Guid.NewGuid(), Code = "ORG_B", Name = "CLB Tin học", ParentId = orgA.Id, IsActive = true };
        var orgC = new Organization { Id = Guid.NewGuid(), Code = "ORG_C", Name = "Khoa Kinh Tế", IsActive = true };

        context.Organizations.AddRange(orgA, orgB, orgC);

        var campA = new Campaign { Id = Guid.NewGuid(), OrganizationId = orgA.Id, Name = "Chiến dịch A", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31), Status = "ACTIVE" };
        var campB = new Campaign { Id = Guid.NewGuid(), OrganizationId = orgB.Id, Name = "Chiến dịch B", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31), Status = "ACTIVE" };
        var campC = new Campaign { Id = Guid.NewGuid(), OrganizationId = orgC.Id, Name = "Chiến dịch C", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31), Status = "ACTIVE" };

        context.Campaigns.AddRange(campA, campB, campC);

        var actA = new Activity { Id = Guid.NewGuid(), CampaignId = campA.Id, Name = "Hoạt động Khoa CNTT", StartTime = DateTimeOffset.UtcNow.AddDays(1), EndTime = DateTimeOffset.UtcNow.AddDays(2), Status = "OPEN" };
        var actB = new Activity { Id = Guid.NewGuid(), CampaignId = campB.Id, Name = "Hoạt động CLB Tin học (Draft)", StartTime = DateTimeOffset.UtcNow.AddDays(3), EndTime = DateTimeOffset.UtcNow.AddDays(4), Status = "DRAFT" };
        var actC = new Activity { Id = Guid.NewGuid(), CampaignId = campC.Id, Name = "Hoạt động Khoa Kinh Tế", StartTime = DateTimeOffset.UtcNow.AddDays(1), EndTime = DateTimeOffset.UtcNow.AddDays(2), Status = "OPEN" };

        context.Activities.AddRange(actA, actB, actC);
        await context.SaveChangesAsync();

        var userId = Guid.NewGuid();
        var adminUser = new User
        {
            Id = userId,
            OrganizationId = orgA.Id,
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "ORGANIZATION_ADMIN" } } }
        };

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(adminUser);
        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(orgA.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { orgA.Id, orgB.Id });

        var handler = new GetAdminActivitiesQueryHandler(context, _currentUserServiceMock.Object, _userRepositoryMock.Object, _organizationRepositoryMock.Object);

        var result = await handler.Handle(new GetAdminActivitiesQuery(PageNumber: 1, PageSize: 10), CancellationToken.None);

        result.TotalCount.Should().Be(2);
        result.Items.Should().Contain(x => x.Id == actA.Id);
        result.Items.Should().Contain(x => x.Id == actB.Id && x.Status == "DRAFT");
        result.Items.Should().NotContain(x => x.Id == actC.Id);
    }

    [Fact]
    public async Task Handle_WhenSuperAdmin_ShouldReturnAllActivitiesAcrossSystem()
    {
        await using var context = CreateInMemoryDbContext();

        var orgA = new Organization { Id = Guid.NewGuid(), Code = "ORG_A", Name = "Khoa CNTT", IsActive = true };
        var orgC = new Organization { Id = Guid.NewGuid(), Code = "ORG_C", Name = "Khoa Kinh Tế", IsActive = true };
        context.Organizations.AddRange(orgA, orgC);

        var campA = new Campaign { Id = Guid.NewGuid(), OrganizationId = orgA.Id, Name = "Chiến dịch A", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31), Status = "ACTIVE" };
        var campC = new Campaign { Id = Guid.NewGuid(), OrganizationId = orgC.Id, Name = "Chiến dịch C", StartDate = new DateOnly(2026, 1, 1), EndDate = new DateOnly(2026, 12, 31), Status = "ACTIVE" };
        context.Campaigns.AddRange(campA, campC);

        var actA = new Activity { Id = Guid.NewGuid(), CampaignId = campA.Id, Name = "Hoạt động CNTT", StartTime = DateTimeOffset.UtcNow.AddDays(1), EndTime = DateTimeOffset.UtcNow.AddDays(2), Status = "OPEN" };
        var actC = new Activity { Id = Guid.NewGuid(), CampaignId = campC.Id, Name = "Hoạt động Kinh Tế", StartTime = DateTimeOffset.UtcNow.AddDays(1), EndTime = DateTimeOffset.UtcNow.AddDays(2), Status = "OPEN" };
        context.Activities.AddRange(actA, actC);
        await context.SaveChangesAsync();

        var userId = Guid.NewGuid();
        var superAdmin = new User
        {
            Id = userId,
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
        };

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(superAdmin);

        var handler = new GetAdminActivitiesQueryHandler(context, _currentUserServiceMock.Object, _userRepositoryMock.Object, _organizationRepositoryMock.Object);

        var result = await handler.Handle(new GetAdminActivitiesQuery(PageNumber: 1, PageSize: 10), CancellationToken.None);

        result.TotalCount.Should().Be(2);
        result.Items.Should().Contain(x => x.Id == actA.Id);
        result.Items.Should().Contain(x => x.Id == actC.Id);
    }

    [Fact]
    public async Task Handle_WhenVolunteerCallsAdminQuery_ShouldThrowUnauthorizedAccessException()
    {
        await using var context = CreateInMemoryDbContext();

        var userId = Guid.NewGuid();
        var volunteer = new User
        {
            Id = userId,
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "VOLUNTEER" } } }
        };

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(volunteer);

        var handler = new GetAdminActivitiesQueryHandler(context, _currentUserServiceMock.Object, _userRepositoryMock.Object, _organizationRepositoryMock.Object);

        var act = () => handler.Handle(new GetAdminActivitiesQuery(), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
