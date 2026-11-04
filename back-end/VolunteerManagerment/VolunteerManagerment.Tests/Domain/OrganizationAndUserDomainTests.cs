using FluentAssertions;
using Moq;
using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Domain.Exceptions;
using Xunit;

namespace VolunteerManagerment.Tests.Domain;

public class OrganizationAndUserDomainTests
{
    [Fact]
    public void Organization_TreeHierarchyAndLifecycleMethods_ShouldEnforceDomainRules()
    {
        var now = DateTimeOffset.UtcNow;
        var rootOrg = new Organization
        {
            Code = "DOAN_TRUONG",
            Name = "Đoàn Trường Đại học Đồng Tháp",
            IsActive = true
        };

        rootOrg.Invoking(o => o.EnsureActiveAsParent()).Should().NotThrow();

        rootOrg.Deactivate(now);
        rootOrg.IsActive.Should().BeFalse();
        rootOrg.Invoking(o => o.EnsureActiveAsParent())
            .Should().Throw<DomainException>()
            .WithMessage("*Tổ chức cha không tồn tại hoặc đã ngừng hoạt động*");

        rootOrg.Activate(now.AddMinutes(5));
        rootOrg.IsActive.Should().BeTrue();

        // Cập nhật thông tin đơn vị hợp lệ (tự động Trim khoảng trắng)
        rootOrg.UpdateDetails("  DOAN_CNTT  ", "  Đoàn Khoa CNTT  ", "  Mô tả  ", true, now.AddMinutes(10));
        rootOrg.Code.Should().Be("DOAN_CNTT");
        rootOrg.Name.Should().Be("Đoàn Khoa CNTT");
        rootOrg.Description.Should().Be("Mô tả");

        // Mã hoặc tên rỗng -> ném DomainException
        rootOrg.Invoking(o => o.UpdateDetails("", "Tên hợp lệ", null, true, now))
            .Should().Throw<DomainException>().WithMessage("*Mã tổ chức không được để trống*");
        rootOrg.Invoking(o => o.UpdateDetails("CODE", "   ", null, true, now))
            .Should().Throw<DomainException>().WithMessage("*Tên tổ chức không được để trống*");
    }

    [Fact]
    public void User_AuthenticationRolesAvatarAndStatusMethods_ShouldBehaveCorrectly()
    {
        var now = DateTimeOffset.UtcNow;
        var user = new User
        {
            Username = "admin_dthu",
            Email = "admin@dthu.edu.vn",
            IsActive = true
        };

        var role = new Role
        {
            Id = Guid.NewGuid(),
            Code = "SUPER_ADMIN",
            Name = "Quản trị viên cấp cao"
        };

        user.UserRoles.Add(new UserRole { UserId = user.Id, User = user, RoleId = role.Id, Role = role });

        user.Invoking(u => u.EnsureActiveForLogin()).Should().NotThrow();
        user.RecordLogin(now);
        user.LastLoginAt.Should().Be(now);

        user.GetRoleCodes().Should().ContainSingle().Which.Should().Be("SUPER_ADMIN");
        user.HasRole("super_admin").Should().BeTrue();
        user.HasRole("VOLUNTEER").Should().BeFalse();

        // Cập nhật ảnh đại diện
        user.UpdateAvatar("  /uploads/avatars/face.jpg  ", now);
        user.AvatarUrl.Should().Be("/uploads/avatars/face.jpg");
        user.Invoking(u => u.UpdateAvatar("   ", now))
            .Should().Throw<DomainException>().WithMessage("*Đường dẫn ảnh đại diện không được để trống*");

        // Khoá tài khoản -> đăng nhập bị từ chối
        user.ToggleActiveStatus(now.AddMinutes(1));
        user.IsActive.Should().BeFalse();
        user.Invoking(u => u.EnsureActiveForLogin())
            .Should().Throw<UnauthorizedAccessException>()
            .WithMessage("*Tài khoản của bạn đã bị vô hiệu hóa*");
    }

    [Fact]
    public void IAuditableEntity_CanBeMockedAndVerifiedWithMoq()
    {
        var auditableMock = new Mock<IAuditableEntity>();
        var timestamp = DateTimeOffset.UtcNow;

        auditableMock.SetupProperty(a => a.CreatedAt, timestamp);
        auditableMock.SetupProperty(a => a.UpdatedAt, timestamp);

        var entity = auditableMock.Object;
        entity.UpdatedAt = timestamp.AddMinutes(5);

        entity.CreatedAt.Should().Be(timestamp);
        entity.UpdatedAt.Should().Be(timestamp.AddMinutes(5));
        auditableMock.VerifySet(a => a.UpdatedAt = timestamp.AddMinutes(5), Times.Once);
    }
}
