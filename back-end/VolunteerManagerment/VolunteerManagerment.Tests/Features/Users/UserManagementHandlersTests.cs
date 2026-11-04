using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Users.Commands.AdminResetPassword;
using VolunteerManagerment.Application.Features.Users.Commands.CreateUser;
using VolunteerManagerment.Application.Features.Users.Commands.ToggleUserStatus;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Users;

public class UserManagementHandlersTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task ToggleUserStatus_WhenUserTriesToLockSelf_ShouldThrowInvalidOperationException()
    {
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var handler = new ToggleUserStatusCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var act = () => handler.Handle(new ToggleUserStatusCommand(userId, false), CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Bạn không thể tự khóa/mở khóa tài khoản của chính mình*");
    }

    [Fact]
    public async Task ToggleUserStatus_WhenSuperAdminLocksUser_ShouldAlsoSyncVolunteerIsActive()
    {
        var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var targetUserId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(adminId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(adminId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = adminId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        var role = new Role { Id = Guid.NewGuid(), Code = "VOLUNTEER", Name = "Tình nguyện viên" };
        var targetUser = new User
        {
            Id = targetUserId,
            Username = "sv01",
            Email = "sv01@dthu.edu.vn",
            OrganizationId = orgId,
            IsActive = true,
            UserRoles = new List<UserRole> { new() { UserId = targetUserId, RoleId = role.Id, Role = role } }
        };
        var volunteer = new Volunteer
        {
            Id = Guid.NewGuid(),
            UserId = targetUserId,
            OrganizationId = orgId,
            VolunteerCode = "TNV-01",
            FullName = "Nguyễn Văn SV",
            IsActive = true
        };

        context.Roles.Add(role);
        context.Users.Add(targetUser);
        context.Volunteers.Add(volunteer);
        await context.SaveChangesAsync();

        var handler = new ToggleUserStatusCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var result = await handler.Handle(new ToggleUserStatusCommand(targetUserId, false), CancellationToken.None);

        result.Should().BeTrue();
        targetUser.IsActive.Should().BeFalse();
        volunteer.IsActive.Should().BeFalse();
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task AdminResetPassword_WhenOrgAdminTriesToResetSuperAdminPassword_ShouldThrowUnauthorizedAccessException()
    {
        var context = CreateInMemoryDbContext();
        var orgAdminId = Guid.NewGuid();
        var superAdminId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(orgAdminId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(orgAdminId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = orgAdminId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "ORGANIZATION_ADMIN" } } }
            });

        var superRole = new Role { Id = Guid.NewGuid(), Code = "SUPER_ADMIN", Name = "Super Admin" };
        var superUser = new User
        {
            Id = superAdminId,
            Username = "root_admin",
            Email = "root@dthu.edu.vn",
            UserRoles = new List<UserRole> { new() { UserId = superAdminId, RoleId = superRole.Id, Role = superRole } }
        };
        context.Roles.Add(superRole);
        context.Users.Add(superUser);
        await context.SaveChangesAsync();

        var handler = new AdminResetPasswordCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _passwordHasherMock.Object,
            _unitOfWorkMock.Object
        );

        var act = () => handler.Handle(new AdminResetPasswordCommand(superAdminId, "NewPass@123"), CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Quản trị viên cấp cao (SUPER_ADMIN)*");
    }

    [Fact]
    public async Task CreateUser_WhenOrgAdminTriesToAssignSuperAdminRole_ShouldThrowUnauthorizedAccessException()
    {
        var context = CreateInMemoryDbContext();
        var orgAdminId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(orgAdminId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(orgAdminId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = orgAdminId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "ORGANIZATION_ADMIN" } } }
            });

        var handler = new CreateUserCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _passwordHasherMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new CreateUserCommand(
            Username: "hacker_admin",
            Email: "hacker@dthu.edu.vn",
            Password: "Password@123",
            OrganizationId: Guid.NewGuid(),
            RoleCodes: new List<string> { "SUPER_ADMIN" }
        );

        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Bạn không có quyền phân quyền Quản trị viên cấp cao (SUPER_ADMIN)*");
    }
}
