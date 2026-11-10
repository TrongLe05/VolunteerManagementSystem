using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Activities.Commands.UpdateActivity;
using VolunteerManagerment.Application.Features.Activities.DTOs;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using VolunteerManagerment.Infrastructure.Persistence.Repository;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Activities;

public class UpdateActivityCommandHandlerTests
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
    public async Task UpdateActivity_WhenStartTimeIsInPastAndEndTimeInFuture_ShouldAutoTransitionToOngoing()
    {
        var org = new Organization { Id = Guid.NewGuid(), Code = "ORG1", Name = "Org 1", IsActive = true };
        var user = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Organization = org,
            Username = "admin",
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
        };

        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Organization = org,
            Name = "Chiến dịch hè",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            Status = "ONGOING",
            CreatedBy = user.Id,
            Creator = user
        };

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            CampaignId = campaign.Id,
            Campaign = campaign,
            Name = "Hoạt động bảo vệ môi trường",
            StartTime = DateTimeOffset.UtcNow.AddHours(2),
            EndTime = DateTimeOffset.UtcNow.AddHours(4),
            Status = "OPEN",
            CreatedBy = user.Id,
            Creator = user
        };

        await using var db = CreateInMemoryDbContext();
        db.Organizations.Add(org);
        db.Users.Add(user);
        db.Campaigns.Add(campaign);
        db.Activities.Add(activity);
        await db.SaveChangesAsync();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(user.Id);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var unitOfWork = new UnitOfWork(db);
        var activityRepo = new ActivityRepository(db);

        var handler = new UpdateActivityCommandHandler(
            db,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            activityRepo,
            _organizationRepositoryMock.Object,
            unitOfWork
        );

        // Update StartTime to 30 mins ago, EndTime to in 2 hours, status sent from form as "OPEN"
        var command = new UpdateActivityCommand(
            activity.Id,
            "Hoạt động bảo vệ môi trường (Cập nhật)",
            "Mô tả mới",
            DateTimeOffset.UtcNow.AddMinutes(-30),
            DateTimeOffset.UtcNow.AddHours(2),
            50,
            1.0m,
            "OPEN",
            new List<UpdateActivityLocationRequest>()
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        activity.Status.Should().Be("ONGOING");
    }

    [Fact]
    public async Task UpdateActivity_WhenEndTimeIsInPast_ShouldAutoTransitionToCompleted()
    {
        var org = new Organization { Id = Guid.NewGuid(), Code = "ORG2", Name = "Org 2", IsActive = true };
        var user = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Organization = org,
            Username = "admin2",
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
        };

        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Organization = org,
            Name = "Chiến dịch",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-10)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            Status = "ONGOING",
            CreatedBy = user.Id,
            Creator = user
        };

        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            CampaignId = campaign.Id,
            Campaign = campaign,
            Name = "Hoạt động",
            StartTime = DateTimeOffset.UtcNow.AddHours(-3),
            EndTime = DateTimeOffset.UtcNow.AddHours(1),
            Status = "ONGOING",
            CreatedBy = user.Id,
            Creator = user
        };

        await using var db = CreateInMemoryDbContext();
        db.Organizations.Add(org);
        db.Users.Add(user);
        db.Campaigns.Add(campaign);
        db.Activities.Add(activity);
        await db.SaveChangesAsync();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(user.Id);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var unitOfWork = new UnitOfWork(db);
        var activityRepo = new ActivityRepository(db);

        var handler = new UpdateActivityCommandHandler(
            db,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            activityRepo,
            _organizationRepositoryMock.Object,
            unitOfWork
        );

        // Update EndTime to 10 mins ago, form sends status "ONGOING"
        var command = new UpdateActivityCommand(
            activity.Id,
            "Hoạt động",
            null,
            DateTimeOffset.UtcNow.AddHours(-3),
            DateTimeOffset.UtcNow.AddMinutes(-10),
            50,
            1.0m,
            "ONGOING",
            new List<UpdateActivityLocationRequest>()
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        activity.Status.Should().Be("COMPLETED");
    }
}
