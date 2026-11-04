using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.Queries.GetMyProfile;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Volunteers;

public class GetMyProfileQueryHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IVolunteerRepository> _volunteerRepositoryMock = new();

    [Fact]
    public async Task Handle_WhenAuthenticatedVolunteerExists_ShouldReturnVolunteerDtoWithConsentStatus()
    {
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var orgId = Guid.NewGuid();
        var consentAt = DateTimeOffset.UtcNow.AddDays(-1);

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Volunteer
            {
                Id = volunteerId,
                UserId = userId,
                OrganizationId = orgId,
                Organization = new Organization { Id = orgId, Name = "Đoàn Khoa CNTT" },
                VolunteerCode = "TNV-2026-001",
                StudentCode = "0022410001",
                FullName = "Lê Minh",
                Gender = "MALE",
                Phone = "0912345678",
                ClassName = "ĐHCNTT22A",
                ConsentFaceAuth = true,
                ConsentGivenAt = consentAt
            });

        var handler = new GetMyProfileQueryHandler(_currentUserServiceMock.Object, _volunteerRepositoryMock.Object);
        var dto = await handler.Handle(new GetMyProfileQuery(), CancellationToken.None);

        dto.Id.Should().Be(volunteerId);
        dto.FullName.Should().Be("Lê Minh");
        dto.StudentCode.Should().Be("0022410001");
        dto.OrganizationName.Should().Be("Đoàn Khoa CNTT");
        dto.ConsentFaceAuth.Should().BeTrue();
        dto.ConsentGivenAt.Should().Be(consentAt);
    }

    [Fact]
    public async Task Handle_WhenVolunteerProfileNotFound_ShouldThrowKeyNotFoundException()
    {
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Volunteer?)null);

        var handler = new GetMyProfileQueryHandler(_currentUserServiceMock.Object, _volunteerRepositoryMock.Object);
        var act = () => handler.Handle(new GetMyProfileQuery(), CancellationToken.None);

        await act.Should().ThrowAsync<KeyNotFoundException>()
            .WithMessage("*Không tìm thấy hồ sơ tình nguyện viên*");
    }
}
