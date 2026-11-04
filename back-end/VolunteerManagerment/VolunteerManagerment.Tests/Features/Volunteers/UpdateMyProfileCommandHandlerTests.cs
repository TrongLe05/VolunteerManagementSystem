using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.Commands.UpdateMyProfile;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Volunteers;

public class UpdateMyProfileCommandHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IVolunteerRepository> _volunteerRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    [Fact]
    public async Task Handle_WhenConsentFaceAuthChangedToTrue_ShouldSetConsentGivenAtToUtcNow()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var volunteer = new Volunteer
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FullName = "Nguyễn Văn Test",
            ConsentFaceAuth = false,
            ConsentGivenAt = null
        };

        _volunteerRepositoryMock
            .Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(volunteer);

        var handler = new UpdateMyProfileCommandHandler(
            _currentUserServiceMock.Object,
            _volunteerRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new UpdateMyProfileCommand(
            FullName: "Nguyễn Văn Test Updated",
            Phone: "0901234567",
            Gender: "MALE",
            DateOfBirth: null,
            ClassName: "ĐH CNTT 21A",
            StudentCode: null,
            ConsentFaceAuth: true
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        volunteer.ConsentFaceAuth.Should().BeTrue();
        volunteer.ConsentGivenAt.Should().NotBeNull();
        volunteer.ConsentGivenAt!.Value.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));

        _volunteerRepositoryMock.Verify(r => r.Update(volunteer), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenConsentFaceAuthRevoked_ShouldClearConsentGivenAt()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var volunteer = new Volunteer
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FullName = "Nguyễn Văn Test",
            ConsentFaceAuth = true,
            ConsentGivenAt = DateTimeOffset.UtcNow.AddDays(-10)
        };

        _volunteerRepositoryMock
            .Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(volunteer);

        var handler = new UpdateMyProfileCommandHandler(
            _currentUserServiceMock.Object,
            _volunteerRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new UpdateMyProfileCommand(
            FullName: "Nguyễn Văn Test",
            Phone: "0901234567",
            Gender: "MALE",
            DateOfBirth: null,
            ClassName: "ĐH CNTT 21A",
            StudentCode: null,
            ConsentFaceAuth: false
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().BeTrue();
        volunteer.ConsentFaceAuth.Should().BeFalse();
        volunteer.ConsentGivenAt.Should().BeNull();

        _volunteerRepositoryMock.Verify(r => r.Update(volunteer), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUserNotAuthenticated_ShouldThrowUnauthorizedAccessException()
    {
        // Arrange
        _currentUserServiceMock.Setup(s => s.UserId).Returns((Guid?)null);

        var handler = new UpdateMyProfileCommandHandler(
            _currentUserServiceMock.Object,
            _volunteerRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new UpdateMyProfileCommand("Name", null, null, null, null, null, false);

        // Act & Assert
        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
