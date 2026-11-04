using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Activities.Commands.RegisterActivity;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Activities;

public class RegisterActivityCommandHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IActivityRepository> _activityRepositoryMock = new();
    private readonly Mock<IVolunteerRepository> _volunteerRepositoryMock = new();
    private readonly Mock<IActivityRegistrationRepository> _registrationRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private RegisterActivityCommandHandler CreateHandler() => new(
        _currentUserServiceMock.Object,
        _activityRepositoryMock.Object,
        _volunteerRepositoryMock.Object,
        _registrationRepositoryMock.Object,
        _organizationRepositoryMock.Object,
        _unitOfWorkMock.Object
    );

    [Fact]
    public async Task Handle_WhenValidRequest_ShouldCreateNewRegistration()
    {
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer
            {
                Id = volunteerId,
                UserId = userId,
                OrganizationId = orgId,
                StudentCode = "0022410001",
                IsActive = true
            });

        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Activity
            {
                Id = activityId,
                Status = "OPEN",
                EndTime = DateTimeOffset.UtcNow.AddDays(2),
                Capacity = 50,
                Campaign = new Campaign { OrganizationId = orgId }
            });

        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { orgId });

        _registrationRepositoryMock.Setup(r => r.GetByActivityAndVolunteerAsync(activityId, volunteerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ActivityRegistration?)null);

        _registrationRepositoryMock.Setup(r => r.CountActivityRegistrationsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(10);

        var handler = CreateHandler();
        var result = await handler.Handle(new RegisterActivityCommand(activityId), CancellationToken.None);

        result.Should().NotBeEmpty();
        _registrationRepositoryMock.Verify(r => r.AddAsync(It.Is<ActivityRegistration>(reg =>
            reg.ActivityId == activityId &&
            reg.VolunteerId == volunteerId &&
            reg.Status == "REGISTERED"
        ), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenMissingStudentCode_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                StudentCode = "",
                IsActive = true
            });

        var handler = CreateHandler();
        var act = () => handler.Handle(new RegisterActivityCommand(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Mã số sinh viên (MSSV)*");
    }

    [Fact]
    public async Task Handle_WhenVolunteerIsInactive_ShouldThrowUnauthorizedAccessException()
    {
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                StudentCode = "0022410001",
                IsActive = false
            });

        var handler = CreateHandler();
        var act = () => handler.Handle(new RegisterActivityCommand(Guid.NewGuid()), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*đang bị khoá*");
    }

    [Fact]
    public async Task Handle_WhenActivityNotOpen_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                StudentCode = "0022410001",
                IsActive = true
            });

        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Activity
            {
                Id = activityId,
                Status = "CLOSED",
                EndTime = DateTimeOffset.UtcNow.AddDays(1)
            });

        var handler = CreateHandler();
        var act = () => handler.Handle(new RegisterActivityCommand(activityId), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*hiện không mở đăng ký*");
    }

    [Fact]
    public async Task Handle_WhenCapacityReached_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer
            {
                Id = volunteerId,
                UserId = userId,
                OrganizationId = orgId,
                StudentCode = "0022410001",
                IsActive = true
            });

        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Activity
            {
                Id = activityId,
                Status = "OPEN",
                EndTime = DateTimeOffset.UtcNow.AddDays(2),
                Capacity = 20,
                Campaign = new Campaign { OrganizationId = orgId }
            });

        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { orgId });

        _registrationRepositoryMock.Setup(r => r.CountActivityRegistrationsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(20);

        var handler = CreateHandler();
        var act = () => handler.Handle(new RegisterActivityCommand(activityId), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*đạt giới hạn số lượng đăng ký*");
    }

    [Fact]
    public async Task Handle_WhenPreviouslyCancelled_ShouldReactivateExistingRegistration()
    {
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var orgId = Guid.NewGuid();
        var existingRegId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer
            {
                Id = volunteerId,
                UserId = userId,
                OrganizationId = orgId,
                StudentCode = "0022410001",
                IsActive = true
            });

        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Activity
            {
                Id = activityId,
                Status = "OPEN",
                EndTime = DateTimeOffset.UtcNow.AddDays(2),
                Campaign = new Campaign { OrganizationId = orgId }
            });

        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { orgId });

        var existingReg = new ActivityRegistration
        {
            Id = existingRegId,
            ActivityId = activityId,
            VolunteerId = volunteerId,
            Status = "CANCELLED"
        };
        _registrationRepositoryMock.Setup(r => r.GetByActivityAndVolunteerAsync(activityId, volunteerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingReg);

        var handler = CreateHandler();
        var result = await handler.Handle(new RegisterActivityCommand(activityId), CancellationToken.None);

        result.Should().Be(existingRegId);
        existingReg.Status.Should().Be("REGISTERED");
        _registrationRepositoryMock.Verify(r => r.AddAsync(It.IsAny<ActivityRegistration>(), It.IsAny<CancellationToken>()), Times.Never);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenAlreadyRegistered_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer
            {
                Id = volunteerId,
                UserId = userId,
                OrganizationId = orgId,
                StudentCode = "0022410001",
                IsActive = true
            });

        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Activity
            {
                Id = activityId,
                Status = "OPEN",
                EndTime = DateTimeOffset.UtcNow.AddDays(2),
                Campaign = new Campaign { OrganizationId = orgId }
            });

        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { orgId });

        _registrationRepositoryMock.Setup(r => r.GetByActivityAndVolunteerAsync(activityId, volunteerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ActivityRegistration { Status = "APPROVED" });

        var handler = CreateHandler();
        var act = () => handler.Handle(new RegisterActivityCommand(activityId), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Bạn đã đăng ký hoạt động này rồi*");
    }
}
