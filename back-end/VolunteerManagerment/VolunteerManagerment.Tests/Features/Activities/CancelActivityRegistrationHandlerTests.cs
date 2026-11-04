using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Activities.Commands.CancelActivityRegistration;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Activities;

public class CancelActivityRegistrationHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IVolunteerRepository> _volunteerRepositoryMock = new();
    private readonly Mock<IActivityRepository> _activityRepositoryMock = new();
    private readonly Mock<IActivityRegistrationRepository> _registrationRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private CancelActivityRegistrationHandler CreateHandler() => new(
        _currentUserServiceMock.Object,
        _volunteerRepositoryMock.Object,
        _activityRepositoryMock.Object,
        _registrationRepositoryMock.Object,
        _unitOfWorkMock.Object
    );

    [Fact]
    public async Task Handle_WhenValidCancellationBeforeStartTime_ShouldSetStatusToCancelled()
    {
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        _activityRepositoryMock.Setup(r => r.GetByIdAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Activity
            {
                Id = activityId,
                StartTime = DateTimeOffset.UtcNow.AddHours(5)
            });

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer { Id = volunteerId, IsActive = true });

        var registration = new ActivityRegistration
        {
            Id = Guid.NewGuid(),
            ActivityId = activityId,
            VolunteerId = volunteerId,
            Status = "REGISTERED"
        };
        _registrationRepositoryMock.Setup(r => r.GetByActivityAndVolunteerAsync(activityId, volunteerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(registration);

        var handler = CreateHandler();
        var result = await handler.Handle(new CancelActivityRegistrationCommand(activityId), CancellationToken.None);

        result.Should().BeTrue();
        registration.Status.Should().Be("CANCELLED");
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenActivityAlreadyStarted_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        _activityRepositoryMock.Setup(r => r.GetByIdAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Activity
            {
                Id = activityId,
                StartTime = DateTimeOffset.UtcNow.AddMinutes(-10)
            });

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer { Id = volunteerId, IsActive = true });

        _registrationRepositoryMock.Setup(r => r.GetByActivityAndVolunteerAsync(activityId, volunteerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ActivityRegistration { Status = "APPROVED" });

        var handler = CreateHandler();
        var act = () => handler.Handle(new CancelActivityRegistrationCommand(activityId), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*hoạt động đã bắt đầu hoặc đã kết thúc*");
    }

    [Fact]
    public async Task Handle_WhenRegistrationAlreadyRejected_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        _activityRepositoryMock.Setup(r => r.GetByIdAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Activity
            {
                Id = activityId,
                StartTime = DateTimeOffset.UtcNow.AddHours(2)
            });

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer { Id = volunteerId, IsActive = true });

        _registrationRepositoryMock.Setup(r => r.GetByActivityAndVolunteerAsync(activityId, volunteerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ActivityRegistration { Status = "REJECTED" });

        var handler = CreateHandler();
        var act = () => handler.Handle(new CancelActivityRegistrationCommand(activityId), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Đơn đăng ký đã bị từ chối*");
    }

    [Fact]
    public async Task Handle_WhenNotRegistered_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        _activityRepositoryMock.Setup(r => r.GetByIdAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Activity { Id = activityId, StartTime = DateTimeOffset.UtcNow.AddHours(2) });

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer { Id = volunteerId, IsActive = true });

        _registrationRepositoryMock.Setup(r => r.GetByActivityAndVolunteerAsync(activityId, volunteerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ActivityRegistration?)null);

        var handler = CreateHandler();
        var act = () => handler.Handle(new CancelActivityRegistrationCommand(activityId), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Bạn chưa đăng ký tham gia hoạt động này*");
    }
}
