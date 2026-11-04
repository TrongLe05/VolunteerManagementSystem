using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Attendances.Commands.CloseAttendanceSession;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Attendances;

public class CloseAttendanceSessionCommandHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenSuperAdminClosesActiveSession_ShouldSetEndedAtToNow()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var user = new User
        {
            Id = userId,
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var campaign = new Campaign
        {
            Id = campaignId,
            OrganizationId = orgId,
            Name = "Chiến dịch Mùa Hè Xanh",
            Status = "ACTIVE"
        };
        var activity = new Activity
        {
            Id = activityId,
            CampaignId = campaignId,
            Campaign = campaign,
            Name = "Ra quân dọn vệ sinh",
            Status = "ONGOING"
        };
        var session = new AttendanceSession
        {
            Id = sessionId,
            ActivityId = activityId,
            Activity = activity,
            Type = "CHECK_IN",
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-2),
            EndedAt = DateTimeOffset.UtcNow.AddMinutes(8)
        };
        context.Campaigns.Add(campaign);
        context.Activities.Add(activity);
        context.AttendanceSessions.Add(session);
        await context.SaveChangesAsync();

        var handler = new CloseAttendanceSessionCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new CloseAttendanceSessionCommand(sessionId);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        var updatedSession = await context.AttendanceSessions.FindAsync(sessionId);
        updatedSession.Should().NotBeNull();
        updatedSession!.EndedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenSessionDoesNotExist_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var user = new User
        {
            Id = userId,
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var handler = new CloseAttendanceSessionCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new CloseAttendanceSessionCommand(Guid.NewGuid());

        // Act & Assert
        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*Phiên điểm danh không tồn tại*");
    }

    [Fact]
    public async Task Handle_WhenOrgAdminFromDifferentOrganization_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var sessionId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();
        var userOrgId = Guid.NewGuid();
        var campaignOrgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var user = new User
        {
            Id = userId,
            OrganizationId = userOrgId,
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "ORGANIZATION_ADMIN" } } }
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(userOrgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { userOrgId });

        var campaign = new Campaign
        {
            Id = campaignId,
            OrganizationId = campaignOrgId,
            Name = "Chiến dịch Khoa Khác",
            Status = "ACTIVE"
        };
        var activity = new Activity
        {
            Id = activityId,
            CampaignId = campaignId,
            Campaign = campaign,
            Name = "Hoạt động Khoa Khác",
            Status = "ONGOING"
        };
        var session = new AttendanceSession
        {
            Id = sessionId,
            ActivityId = activityId,
            Activity = activity,
            Type = "CHECK_IN",
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-5)
        };
        context.Campaigns.Add(campaign);
        context.Activities.Add(activity);
        context.AttendanceSessions.Add(session);
        await context.SaveChangesAsync();

        var handler = new CloseAttendanceSessionCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new CloseAttendanceSessionCommand(sessionId);

        // Act & Assert
        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Bạn không có quyền quản lý phiên điểm danh này*");
    }
}
