using System.Linq.Expressions;
using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Auth.Commands.ChangePassword;
using VolunteerManagerment.Application.Features.Auth.Commands.Logout;
using VolunteerManagerment.Application.Features.Auth.Commands.RefreshTokens;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Auth;

public class LogoutAndRefreshTokenHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IRepository<RefreshToken>> _refreshTokenRepositoryMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IJwtTokenGenerator> _jwtTokenGeneratorMock = new();
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();

    [Fact]
    public async Task Logout_WhenRefreshTokenExists_ShouldRevokeAndReturnTrue()
    {
        var token = new RefreshToken
        {
            Token = "valid-refresh-token",
            IsRevoked = false,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(5)
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.FindAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RefreshToken> { token });

        var handler = new LogoutCommandHandler(_unitOfWorkMock.Object, _refreshTokenRepositoryMock.Object);
        var result = await handler.Handle(new LogoutCommand("valid-refresh-token"), CancellationToken.None);

        result.Should().BeTrue();
        token.IsRevoked.Should().BeTrue();
        token.RevokedAt.Should().NotBeNull();
        _refreshTokenRepositoryMock.Verify(r => r.Update(token), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Logout_WhenRefreshTokenDoesNotExist_ShouldReturnFalse()
    {
        _refreshTokenRepositoryMock
            .Setup(r => r.FindAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RefreshToken>());

        var handler = new LogoutCommandHandler(_unitOfWorkMock.Object, _refreshTokenRepositoryMock.Object);
        var result = await handler.Handle(new LogoutCommand("missing-token"), CancellationToken.None);

        result.Should().BeFalse();
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task RefreshToken_WhenValidTokenAndActiveUser_ShouldRotateTokenAndReturnNewTokens()
    {
        var userId = Guid.NewGuid();
        var existingToken = new RefreshToken
        {
            UserId = userId,
            Token = "old-refresh-token",
            IsRevoked = false,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(3)
        };

        var user = new User
        {
            Id = userId,
            Username = "sv002241",
            IsActive = true,
            Organization = new Organization { Name = "Đoàn Trường ĐH Đồng Tháp" },
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "VOLUNTEER" } } }
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.FindAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RefreshToken> { existingToken });
        _userRepositoryMock
            .Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _jwtTokenGeneratorMock
            .Setup(g => g.GenerateToken(user, It.IsAny<List<string>>(), "Đoàn Trường ĐH Đồng Tháp"))
            .Returns("new-access-token");
        _jwtTokenGeneratorMock
            .Setup(g => g.GenerateRefreshToken())
            .Returns("new-refresh-token");

        var handler = new RefreshTokenCommandHandler(
            _refreshTokenRepositoryMock.Object,
            _userRepositoryMock.Object,
            _jwtTokenGeneratorMock.Object,
            _unitOfWorkMock.Object
        );

        var result = await handler.Handle(new RefreshTokenCommand("expired-jwt", "old-refresh-token"), CancellationToken.None);

        result.AccessToken.Should().Be("new-access-token");
        result.RefreshToken.Should().Be("new-refresh-token");
        existingToken.IsRevoked.Should().BeTrue();
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.Is<RefreshToken>(rt =>
            rt.UserId == userId &&
            rt.Token == "new-refresh-token" &&
            !rt.IsRevoked
        ), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RefreshToken_WhenTokenRevokedOrExpired_ShouldThrowUnauthorizedAccessException()
    {
        var revokedToken = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            Token = "revoked-token",
            IsRevoked = true,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(2)
        };

        _refreshTokenRepositoryMock
            .Setup(r => r.FindAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RefreshToken> { revokedToken });

        var handler = new RefreshTokenCommandHandler(
            _refreshTokenRepositoryMock.Object,
            _userRepositoryMock.Object,
            _jwtTokenGeneratorMock.Object,
            _unitOfWorkMock.Object
        );

        var act = () => handler.Handle(new RefreshTokenCommand("jwt", "revoked-token"), CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Refresh token này đã bị thu hồi*");
    }

    [Fact]
    public async Task ChangePassword_WhenCurrentPasswordIsValid_ShouldUpdatePasswordAndRevokeAllActiveTokens()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            PasswordHash = "old_hash",
            IsActive = true
        };
        var activeToken = new RefreshToken
        {
            UserId = userId,
            Token = "active-rt",
            IsRevoked = false
        };

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasherMock.Setup(h => h.VerifyPassword("OldPass@123", "old_hash")).Returns(true);
        _passwordHasherMock.Setup(h => h.HashPassword("NewPass@456")).Returns("new_hash");
        _refreshTokenRepositoryMock
            .Setup(r => r.FindAsync(It.IsAny<Expression<Func<RefreshToken, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<RefreshToken> { activeToken });

        var handler = new ChangePasswordCommandHandler(
            _currentUserServiceMock.Object,
            _passwordHasherMock.Object,
            _refreshTokenRepositoryMock.Object,
            _userRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var result = await handler.Handle(new ChangePasswordCommand("OldPass@123", "NewPass@456", "NewPass@456"), CancellationToken.None);

        result.Should().BeTrue();
        user.PasswordHash.Should().Be("new_hash");
        activeToken.IsRevoked.Should().BeTrue();
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ChangePassword_WhenCurrentPasswordIsWrong_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Id = userId, PasswordHash = "old_hash" });
        _passwordHasherMock.Setup(h => h.VerifyPassword("WrongOldPass", "old_hash")).Returns(false);

        var handler = new ChangePasswordCommandHandler(
            _currentUserServiceMock.Object,
            _passwordHasherMock.Object,
            _refreshTokenRepositoryMock.Object,
            _userRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var act = () => handler.Handle(new ChangePasswordCommand("WrongOldPass", "NewPass@456", "NewPass@456"), CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Mật khẩu hiện tại không chính xác*");
    }
}
