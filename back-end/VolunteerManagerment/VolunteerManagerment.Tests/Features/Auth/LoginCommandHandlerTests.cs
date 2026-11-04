using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Auth.Commands.Login;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Auth;

public class LoginCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();
    private readonly Mock<IPasswordHasher> _passwordHasherMock = new();
    private readonly Mock<IRepository<RefreshToken>> _refreshTokenRepositoryMock = new();
    private readonly Mock<IJwtTokenGenerator> _jwtTokenGeneratorMock = new();

    private LoginCommandHandler CreateHandler() => new(
        _userRepositoryMock.Object,
        _unitOfWorkMock.Object,
        _passwordHasherMock.Object,
        _refreshTokenRepositoryMock.Object,
        _jwtTokenGeneratorMock.Object
    );

    [Fact]
    public async Task Handle_WhenCredentialsAreValid_ShouldReturnAccessAndRefreshToken()
    {
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Username = "sv002241",
            Email = "sv002241@dthu.edu.vn",
            PasswordHash = "hashed_pw",
            IsActive = true,
            Organization = new Organization { Name = "Đoàn Trường ĐH Đồng Tháp" },
            UserRoles = new List<UserRole>
            {
                new() { Role = new Role { Code = "VOLUNTEER" } }
            }
        };

        _userRepositoryMock.Setup(r => r.GetByUserNameOrEmailAsync("sv002241", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasherMock.Setup(h => h.VerifyPassword("Password@123", "hashed_pw"))
            .Returns(true);
        _jwtTokenGeneratorMock.Setup(g => g.GenerateToken(user, It.IsAny<List<string>>(), "Đoàn Trường ĐH Đồng Tháp"))
            .Returns("mock-jwt-access-token");
        _jwtTokenGeneratorMock.Setup(g => g.GenerateRefreshToken())
            .Returns("mock-refresh-token");

        var handler = CreateHandler();
        var result = await handler.Handle(new LoginCommand("sv002241", "Password@123"), CancellationToken.None);

        result.AccessToken.Should().Be("mock-jwt-access-token");
        result.RefreshToken.Should().Be("mock-refresh-token");
        result.User.Username.Should().Be("sv002241");
        result.User.Roles.Should().Contain("VOLUNTEER");
        _refreshTokenRepositoryMock.Verify(r => r.AddAsync(It.Is<RefreshToken>(rt =>
            rt.UserId == userId &&
            rt.Token == "mock-refresh-token" &&
            !rt.IsRevoked
        ), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenPasswordIsInvalid_ShouldThrowUnauthorizedAccessException()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "sv002241",
            PasswordHash = "hashed_pw",
            IsActive = true
        };

        _userRepositoryMock.Setup(r => r.GetByUserNameOrEmailAsync("sv002241", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasherMock.Setup(h => h.VerifyPassword("WrongPassword", "hashed_pw"))
            .Returns(false);

        var handler = CreateHandler();
        var act = () => handler.Handle(new LoginCommand("sv002241", "WrongPassword"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Tài khoản không tồn tại hoặc mật khẩu không chính xác*");
    }

    [Fact]
    public async Task Handle_WhenAccountIsInactive_ShouldThrowUnauthorizedAccessException()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "sv002241",
            PasswordHash = "hashed_pw",
            IsActive = false
        };

        _userRepositoryMock.Setup(r => r.GetByUserNameOrEmailAsync("sv002241", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _passwordHasherMock.Setup(h => h.VerifyPassword("Password@123", "hashed_pw"))
            .Returns(true);

        var handler = CreateHandler();
        var act = () => handler.Handle(new LoginCommand("sv002241", "Password@123"), CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Tài khoản của bạn đã bị vô hiệu hóa*");
    }
}
