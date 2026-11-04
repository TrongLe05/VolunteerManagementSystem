using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using VolunteerManagerment.Infrastructure.Persistence.Repository;
using Xunit;

namespace VolunteerManagerment.Tests.Infrastructure.Persistence;

public class OrganizationAndUserRepositoryIntegrationTests
{
    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task OrganizationRepository_GetSubOrganizationIdsAndVisibleIds_ShouldTraverseTreeCorrectly()
    {
        await using var context = CreateDbContext();
        var unitOfWork = new UnitOfWork(context);
        var repo = new OrganizationRepository(context);

        var rootOrg = new Organization
        {
            Id = Guid.NewGuid(),
            ParentId = null,
            Code = "DOAN_TRUONG",
            Name = "Đoàn Trường ĐH Đồng Tháp",
            IsActive = true
        };
        var facultyOrg = new Organization
        {
            Id = Guid.NewGuid(),
            ParentId = rootOrg.Id,
            Code = "DOAN_CNTT",
            Name = "Đoàn Khoa CNTT",
            IsActive = true
        };
        var classOrg = new Organization
        {
            Id = Guid.NewGuid(),
            ParentId = facultyOrg.Id,
            Code = "CHI_DOAN_22A",
            Name = "Chi đoàn ĐHCNTT22A",
            IsActive = true
        };
        var inactiveChildOrg = new Organization
        {
            Id = Guid.NewGuid(),
            ParentId = facultyOrg.Id,
            Code = "CHI_DOAN_CU",
            Name = "Chi đoàn Đã Giải Thể",
            IsActive = false
        };

        await repo.AddRangeAsync([rootOrg, facultyOrg, classOrg, inactiveChildOrg]);
        await unitOfWork.SaveChangesAsync();

        // 1. Lấy cây đơn vị con từ Đoàn Khoa CNTT -> Gồm Khoa CNTT và Chi đoàn 22A (bỏ qua Chi đoàn inactive)
        var subOrgIds = await repo.GetSubOrganizationIdsAsync(facultyOrg.Id);
        subOrgIds.Should().HaveCount(2);
        subOrgIds.Should().Contain([facultyOrg.Id, classOrg.Id]);
        subOrgIds.Should().NotContain(inactiveChildOrg.Id);

        // 2. Lấy toàn bộ đơn vị nhìn thấy được từ Đoàn Khoa CNTT -> Bao gồm cả cấp cha (Đoàn Trường) và cấp con (Chi đoàn 22A)
        var visibleIds = await repo.GetVisibleOrganizationIdsAsync(facultyOrg.Id);
        visibleIds.Should().HaveCount(3);
        visibleIds.Should().Contain([rootOrg.Id, facultyOrg.Id, classOrg.Id]);

        // 3. Kiểm tra IsCodeExistsAsync (có và không có excludeId)
        (await repo.IsCodeExistsAsync("DOAN_CNTT")).Should().BeTrue();
        (await repo.IsCodeExistsAsync("DOAN_CNTT", excludeId: facultyOrg.Id)).Should().BeFalse();
        (await repo.IsCodeExistsAsync("KHONG_TON_TAI")).Should().BeFalse();

        // 4. Kiểm tra GetByIdWithChildrenAsync
        var loadedFaculty = await repo.GetByIdWithChildrenAsync(facultyOrg.Id);
        loadedFaculty.Should().NotBeNull();
        loadedFaculty!.Children.Should().HaveCount(2);
    }

    [Fact]
    public async Task UserRepository_GetByUserNameOrEmailAndWithDetails_ShouldIncludeOrganizationAndRoles()
    {
        await using var context = CreateDbContext();
        var unitOfWork = new UnitOfWork(context);
        var userRepo = new UserRepository(context);

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Code = "DOAN_CNTT",
            Name = "Đoàn Khoa CNTT",
            IsActive = true
        };
        var role = new Role
        {
            Id = Guid.NewGuid(),
            Code = "ORGANIZATION_ADMIN",
            Name = "Bí thư Đoàn Khoa"
        };
        var user = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Organization = org,
            Username = "bithu_cntt",
            Email = "bithu.cntt@dthu.edu.vn",
            PasswordHash = "hashed_pw",
            IsActive = true,
            UserRoles =
            [
                new UserRole { RoleId = role.Id, Role = role }
            ]
        };

        context.Organizations.Add(org);
        context.Roles.Add(role);
        await userRepo.AddAsync(user);
        await unitOfWork.SaveChangesAsync();

        // Tìm bằng Username
        var byUsername = await userRepo.GetByUserNameOrEmailAsync("bithu_cntt");
        byUsername.Should().NotBeNull();
        byUsername!.Organization.Name.Should().Be("Đoàn Khoa CNTT");
        byUsername.UserRoles.Should().ContainSingle().Which.Role.Code.Should().Be("ORGANIZATION_ADMIN");

        // Tìm bằng Email
        var byEmail = await userRepo.GetByUserNameOrEmailAsync("bithu.cntt@dthu.edu.vn");
        byEmail.Should().NotBeNull();
        byEmail!.Id.Should().Be(user.Id);

        // Kiểm tra tồn tại Username hoặc Email
        (await userRepo.IsUsernameOrEmailExistedAsync("bithu_cntt", "other@dthu.edu.vn")).Should().BeTrue();
        (await userRepo.IsUsernameOrEmailExistedAsync("other_user", "bithu.cntt@dthu.edu.vn")).Should().BeTrue();
        (await userRepo.IsUsernameOrEmailExistedAsync("new_user", "new@dthu.edu.vn")).Should().BeFalse();

        // Tìm theo Id kèm chi tiết
        var withDetails = await userRepo.GetByIdWithDetailsAsync(user.Id);
        withDetails.Should().NotBeNull();
        withDetails!.GetRoleCodes().Should().Contain("ORGANIZATION_ADMIN");
    }
}
