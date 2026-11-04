using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Organizations.Commands.CreateOrganization;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Organizations;

public class CreateOrganizationCommandHandlerTests
{
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private CreateOrganizationCommandHandler CreateHandler() => new(
        _organizationRepositoryMock.Object,
        _currentUserServiceMock.Object,
        _userRepositoryMock.Object,
        _unitOfWorkMock.Object
    );

    [Fact]
    public async Task Handle_WhenSuperAdminCreatesRootOrganization_ShouldSucceed()
    {
        var userId = Guid.NewGuid();
        _organizationRepositoryMock.Setup(r => r.IsCodeExistsAsync("DOAN_CNTT", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        var handler = CreateHandler();
        var command = new CreateOrganizationCommand(null, "DOAN_CNTT", "Đoàn Khoa CNTT", "Đoàn cơ sở Khoa CNTT");

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().NotBeEmpty();
        _organizationRepositoryMock.Verify(r => r.AddAsync(It.Is<Organization>(o =>
            o.Code == "DOAN_CNTT" &&
            o.Name == "Đoàn Khoa CNTT" &&
            o.IsActive
        ), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenCodeAlreadyExists_ShouldThrowInvalidOperationException()
    {
        _organizationRepositoryMock.Setup(r => r.IsCodeExistsAsync("DOAN_CNTT", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = CreateHandler();
        var act = () => handler.Handle(new CreateOrganizationCommand(null, "DOAN_CNTT", "Đoàn Khoa CNTT", null), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Mã tổ chức đã tồn tại*");
    }

    [Fact]
    public async Task Handle_WhenOrgAdminCreatesOrganizationWithoutParentId_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        _organizationRepositoryMock.Setup(r => r.IsCodeExistsAsync("CHI_DOAN_1", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                OrganizationId = Guid.NewGuid(),
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "ORGANIZATION_ADMIN" } } }
            });

        var handler = CreateHandler();
        var act = () => handler.Handle(new CreateOrganizationCommand(null, "CHI_DOAN_1", "Chi đoàn 1", null), CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Tổ chức con phải có tổ chức cấp trên*");
    }
}
