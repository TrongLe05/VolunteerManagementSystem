using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Attendances.Commands.OpenAttendanceSession;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Attendances;

public class OpenAttendanceSessionCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IActivityRepository> _activityRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<IAttendanceSessionRepository> _attendanceSessionRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private OpenAttendanceSessionCommandHandler CreateHandler()
    {
        return new OpenAttendanceSessionCommandHandler(
            _userRepositoryMock.Object,
            _currentUserServiceMock.Object,
            _activityRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _attendanceSessionRepositoryMock.Object,
            _unitOfWorkMock.Object
        );
    }

    [Fact]
    public async Task Handle_WhenSuperAdminOpensSession_ShouldSucceedAndSave()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var user = new User
        {
            Id = userId,
            OrganizationId = orgId,
            UserRoles = new List<UserRole>
            {
                new() { Role = new Role { Code = "SUPER_ADMIN" } }
            }
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var activity = new Activity
        {
            Id = activityId,
            Name = "Chiến dịch Tết Quân - Dân",
            Status = "OPEN",
            Campaign = new Campaign { OrganizationId = orgId }
        };
        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activity);

        _attendanceSessionRepositoryMock
            .Setup(r => r.HasActiveSessionAsync(activityId, "CHECK_IN", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        var handler = CreateHandler();
        var command = new OpenAttendanceSessionCommand(activityId, "CHECK_IN", 10);

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeEmpty();
        activity.Status.Should().Be("ONGOING");
        _attendanceSessionRepositoryMock.Verify(r => r.AddAsync(It.Is<AttendanceSession>(s =>
            s.ActivityId == activityId &&
            s.Type == "CHECK_IN" &&
            s.CreatedBy == userId
        ), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenActivityNotOpenOrOngoing_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var user = new User
        {
            Id = userId,
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var activity = new Activity
        {
            Id = activityId,
            Name = "Hoạt động đã kết thúc",
            Status = "COMPLETED",
            Campaign = new Campaign { OrganizationId = Guid.NewGuid() }
        };
        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activity);

        var handler = CreateHandler();
        var command = new OpenAttendanceSessionCommand(activityId, "CHECK_IN", 5);

        // Act & Assert
        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*đang mở hoặc đang diễn ra*");
    }

    [Fact]
    public async Task Handle_WhenActiveSessionAlreadyExists_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var user = new User
        {
            Id = userId,
            OrganizationId = orgId,
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var activity = new Activity
        {
            Id = activityId,
            Status = "OPEN",
            Campaign = new Campaign { OrganizationId = orgId }
        };
        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activity);

        _attendanceSessionRepositoryMock
            .Setup(r => r.HasActiveSessionAsync(activityId, "CHECK_IN", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = CreateHandler();
        var command = new OpenAttendanceSessionCommand(activityId, "CHECK_IN", 5);

        // Act & Assert
        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Đã tồn tại phiên điểm danh đang mở*");
    }

    [Fact]
    public async Task Handle_WhenUnauthorizedUser_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var user = new User
        {
            Id = userId,
            OrganizationId = orgId,
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "VOLUNTEER" } } }
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var activity = new Activity
        {
            Id = activityId,
            Status = "OPEN",
            Campaign = new Campaign { OrganizationId = orgId }
        };
        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activity);

        var handler = CreateHandler();
        var command = new OpenAttendanceSessionCommand(activityId, "CHECK_IN", 5);

        // Act & Assert
        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Bạn không có quyền mở phiên điểm danh*");
    }
}
