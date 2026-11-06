using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using VolunteerManagerment.Infrastructure.Persistence.Interceptors;
using Xunit;

namespace VolunteerManagerment.Tests.Infrastructure.Persistence;

public class AuditSaveChangesInterceptorTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<ILogger<AuditSaveChangesInterceptor>> _loggerMock = new();
    private readonly Guid _testUserId = Guid.NewGuid();
    private const string TestEmail = "admin@dthu.edu.vn";
    private const string TestIp = "127.0.0.1";

    public AuditSaveChangesInterceptorTests()
    {
        _currentUserServiceMock.Setup(s => s.UserId).Returns(_testUserId);
        _currentUserServiceMock.Setup(s => s.UserEmail).Returns(TestEmail);
        _currentUserServiceMock.Setup(s => s.IpAddress).Returns(TestIp);
    }

    private ApplicationDbContext CreateDbContext()
    {
        var interceptor = new AuditSaveChangesInterceptor(
            _currentUserServiceMock.Object,
            _loggerMock.Object);

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .AddInterceptors(interceptor)
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task SaveChangesAsync_WhenEntityCreated_ShouldCreateAuditLogWithActionCreate()
    {
        await using var context = CreateDbContext();

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Code = "ORG_TEST",
            Name = "Đoàn Thanh Niên",
            IsActive = true
        };

        context.Organizations.Add(org);
        await context.SaveChangesAsync();

        var audit = await context.AuditLogs.FirstOrDefaultAsync(a => a.EntityId == org.Id);
        audit.Should().NotBeNull();
        audit!.Action.Should().Be("CREATE");
        audit.EntityType.Should().Be(nameof(Organization));
        audit.EntityId.Should().Be(org.Id);
        audit.UserId.Should().Be(_testUserId);
        audit.IpAddress.Should().NotBeNull();
        audit.IpAddress!.ToString().Should().Be(TestIp);
        audit.NewValues.Should().Contain("ORG_TEST");
        audit.OldValues.Should().BeNull();
    }

    [Fact]
    public async Task SaveChangesAsync_WhenEntityUpdated_ShouldCreateAuditLogWithActionUpdateAndDiff()
    {
        await using var context = CreateDbContext();

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Code = "ORG_OLD",
            Name = "Tổ chức cũ",
            IsActive = true
        };

        context.Organizations.Add(org);
        await context.SaveChangesAsync();

        // Update entity
        org.Name = "Tổ chức mới đã đổi tên";
        await context.SaveChangesAsync();

        var updateAudit = await context.AuditLogs
            .Where(a => a.EntityId == org.Id && a.Action == "UPDATE")
            .FirstOrDefaultAsync();

        updateAudit.Should().NotBeNull();
        updateAudit!.EntityType.Should().Be(nameof(Organization));
        updateAudit.OldValues.Should().Contain("Tổ chức cũ");
        updateAudit.NewValues.Should().Contain("Tổ chức mới đã đổi tên");
    }

    [Fact]
    public async Task SaveChangesAsync_WhenEntityDeleted_ShouldCreateAuditLogWithActionDelete()
    {
        await using var context = CreateDbContext();

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Code = "ORG_DEL",
            Name = "Tổ chức sắp xoá",
            IsActive = true
        };

        context.Organizations.Add(org);
        await context.SaveChangesAsync();

        context.Organizations.Remove(org);
        await context.SaveChangesAsync();

        var deleteAudit = await context.AuditLogs
            .Where(a => a.EntityId == org.Id && a.Action == "DELETE")
            .FirstOrDefaultAsync();

        deleteAudit.Should().NotBeNull();
        deleteAudit!.EntityType.Should().Be(nameof(Organization));
        deleteAudit.OldValues.Should().Contain("Tổ chức sắp xoá");
        deleteAudit.NewValues.Should().BeNull();
    }

    [Fact]
    public async Task SaveChangesAsync_WhenExcludedEntityModified_ShouldNotCreateAuditLog()
    {
        await using var context = CreateDbContext();

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "user_test",
            Email = "user@dthu.edu.vn",
            PasswordHash = "hash"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = "secret-refresh-token",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7)
        };

        context.RefreshTokens.Add(token);
        await context.SaveChangesAsync();

        var tokenAudit = await context.AuditLogs.FirstOrDefaultAsync(a => a.EntityId == token.Id);
        tokenAudit.Should().BeNull();
    }
}
