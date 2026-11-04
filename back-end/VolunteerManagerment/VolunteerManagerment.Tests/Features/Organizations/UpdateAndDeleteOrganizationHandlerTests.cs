using System.Linq.Expressions;
using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Organizations.Commands.DeleteOrganization;
using VolunteerManagerment.Application.Features.Organizations.Commands.UpdateOrganization;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Organizations;

public class UpdateAndDeleteOrganizationHandlerTests
{
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    [Fact]
    public async Task UpdateOrganization_WhenValid_ShouldUpdateAndSave()
    {
        var userId = Guid.NewGuid();
        var orgId = Guid.NewGuid();
        var parentId = Guid.NewGuid();
        var org = new Organization { Id = orgId, ParentId = parentId, Code = "OLD", Name = "Tên cũ", IsActive = true };

        _organizationRepositoryMock.Setup(r => r.IsCodeExistsAsync("NEW_CODE", orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });
        _organizationRepositoryMock.Setup(r => r.GetByIdAsync(orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(org);

        var handler = new UpdateOrganizationCommandHandler(
            _organizationRepositoryMock.Object,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var result = await handler.Handle(new UpdateOrganizationCommand(orgId, parentId, "NEW_CODE", "Tên mới", "Mô tả", true), CancellationToken.None);

        result.Should().BeTrue();
        org.Code.Should().Be("NEW_CODE");
        org.Name.Should().Be("Tên mới");
        _organizationRepositoryMock.Verify(r => r.Update(org), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteOrganization_WhenDeletingRootOrganization_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var rootOrgId = Guid.NewGuid();

        _organizationRepositoryMock.Setup(r => r.GetByIdAsync(rootOrgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Organization { Id = rootOrgId, ParentId = null, IsActive = true });
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        var handler = new DeleteOrganizationCommandHandler(
            _organizationRepositoryMock.Object,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var act = () => handler.Handle(new DeleteOrganizationCommand(rootOrgId), CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Không thể xóa tổ chức cao nhất của hệ thống*");
    }

    [Fact]
    public async Task DeleteOrganization_WhenHasActiveChildren_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _organizationRepositoryMock.Setup(r => r.GetByIdAsync(orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Organization { Id = orgId, ParentId = Guid.NewGuid(), IsActive = true });
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });
        _organizationRepositoryMock
            .Setup(r => r.FindAsync(It.IsAny<Expression<Func<Organization, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Organization> { new() { Id = Guid.NewGuid(), IsActive = true } });

        var handler = new DeleteOrganizationCommandHandler(
            _organizationRepositoryMock.Object,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var act = () => handler.Handle(new DeleteOrganizationCommand(orgId), CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*còn tổ chức con đang hoạt động*");
    }
}
