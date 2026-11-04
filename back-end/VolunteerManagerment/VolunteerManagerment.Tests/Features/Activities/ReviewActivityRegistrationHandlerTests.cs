using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Activities.Commands.ReviewActivityRegistration;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Activities;

public class ReviewActivityRegistrationHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<IActivityRegistrationRepository> _registrationRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private ReviewActivityRegistrationHandler CreateHandler() => new(
        _currentUserServiceMock.Object,
        _userRepositoryMock.Object,
        _organizationRepositoryMock.Object,
        _registrationRepositoryMock.Object,
        _unitOfWorkMock.Object
    );

    [Fact]
    public async Task Handle_WhenSuperAdminApprovesRegistration_ShouldUpdateStatusAndApprover()
    {
        var userId = Guid.NewGuid();
        var registrationId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        var registration = new ActivityRegistration
        {
            Id = registrationId,
            ActivityId = activityId,
            Status = "REGISTERED",
            Activity = new Activity
            {
                Id = activityId,
                Status = "OPEN",
                Campaign = new Campaign { OrganizationId = Guid.NewGuid() }
            }
        };

        _registrationRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(registrationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(registration);

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        var handler = CreateHandler();
        var result = await handler.Handle(new ReviewActivityRegistrationCommand(activityId, registrationId, "APPROVED"), CancellationToken.None);

        result.Should().BeTrue();
        registration.Status.Should().Be("APPROVED");
        registration.ApprovedBy.Should().Be(userId);
        registration.ApprovedAt.Should().NotBeNull();
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenOrgAdminOfAnotherOrgTriesToReview_ShouldThrowUnauthorizedAccessException()
    {
        var userId = Guid.NewGuid();
        var registrationId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var userOrgId = Guid.NewGuid();
        var otherOrgId = Guid.NewGuid();

        _registrationRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(registrationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ActivityRegistration
            {
                Id = registrationId,
                ActivityId = activityId,
                Status = "REGISTERED",
                Activity = new Activity
                {
                    Id = activityId,
                    Status = "OPEN",
                    Campaign = new Campaign { OrganizationId = otherOrgId }
                }
            });

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                OrganizationId = userOrgId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "ORGANIZATION_ADMIN" } } }
            });

        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(userOrgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { userOrgId });

        var handler = CreateHandler();
        var act = () => handler.Handle(new ReviewActivityRegistrationCommand(activityId, registrationId, "APPROVED"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Bạn không có quyền duyệt đơn đăng ký này*");
    }

    [Fact]
    public async Task Handle_WhenRegistrationAlreadyCancelledByVolunteer_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var registrationId = Guid.NewGuid();
        var activityId = Guid.NewGuid();

        _registrationRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(registrationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ActivityRegistration
            {
                Id = registrationId,
                ActivityId = activityId,
                Status = "CANCELLED",
                Activity = new Activity { Id = activityId, Status = "OPEN", Campaign = new Campaign() }
            });

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        var handler = CreateHandler();
        var act = () => handler.Handle(new ReviewActivityRegistrationCommand(activityId, registrationId, "APPROVED"), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Tình nguyện viên đã huỷ đơn đăng ký này*");
    }
}
