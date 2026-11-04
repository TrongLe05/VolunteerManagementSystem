using System.Security.Claims;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.JsonWebTokens;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Authentication;
using VolunteerManagerment.Infrastructure.Services;
using Xunit;

namespace VolunteerManagerment.Tests.Infrastructure.Services;

public class AuthenticationAndSecurityIntegrationTests
{
    [Fact]
    public void JwtTokenGenerator_ShouldGenerateValidJwtWithAllClaims_AndUniqueRefreshTokens()
    {
        var configValues = new Dictionary<string, string?>
        {
            ["JwtSetting:Secret"] = "SuperSecretKeyForVolunteerManagementSystem2026_AtLeast32Bytes!",
            ["JwtSetting:Issuer"] = "VolunteerManagement.API",
            ["JwtSetting:Audience"] = "VolunteerManagement.Client"
        };
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configValues)
            .Build();

        var generator = new JwtTokenGenerator(configuration);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "sv002241",
            Email = "sv002241@dthu.edu.vn"
        };

        var jwt = generator.GenerateToken(user, ["VOLUNTEER", "ORGANIZATION_ADMIN"], "Đoàn Khoa CNTT");
        jwt.Should().NotBeNullOrWhiteSpace();

        var handler = new JsonWebTokenHandler();
        var parsedToken = handler.ReadJsonWebToken(jwt);

        parsedToken.Issuer.Should().Be("VolunteerManagement.API");
        parsedToken.Audiences.Should().Contain("VolunteerManagement.Client");
        parsedToken.Subject.Should().Be(user.Id.ToString());
        parsedToken.GetClaim(JwtRegisteredClaimNames.Name).Value.Should().Be("sv002241");
        parsedToken.GetClaim(JwtRegisteredClaimNames.Email).Value.Should().Be("sv002241@dthu.edu.vn");
        parsedToken.GetClaim("organization").Value.Should().Be("Đoàn Khoa CNTT");

        var refreshToken1 = generator.GenerateRefreshToken();
        var refreshToken2 = generator.GenerateRefreshToken();
        refreshToken1.Should().NotBeNullOrWhiteSpace();
        refreshToken1.Should().NotBe(refreshToken2);
    }

    [Fact]
    public void JwtTokenGenerator_WhenSecretKeyMissing_ShouldThrowInvalidOperationException()
    {
        var emptyConfig = new ConfigurationBuilder().Build();
        var generator = new JwtTokenGenerator(emptyConfig);

        var act = () => generator.GenerateToken(new User(), ["VOLUNTEER"], "Đoàn Trường");
        act.Should().Throw<InvalidOperationException>()
            .WithMessage("*Chưa cấu hình secret key*");
    }

    [Fact]
    public void BCryptPasswordHasher_ShouldHashAndVerifyPasswordAccurately()
    {
        var hasher = new BCryptPasswordHasher();
        var hash = hasher.HashPassword("MatKhauAnToan@2026");

        hash.Should().NotBeNullOrWhiteSpace();
        hash.Should().NotBe("MatKhauAnToan@2026");
        hasher.VerifyPassword("MatKhauAnToan@2026", hash).Should().BeTrue();
        hasher.VerifyPassword("SaiMatKhau", hash).Should().BeFalse();
    }

    [Fact]
    public void CurrentUserService_ShouldExtractUserIdFromHttpContextClaims()
    {
        var expectedUserId = Guid.NewGuid();
        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, expectedUserId.ToString())
            ], "TestAuth"))
        };

        var accessor = new HttpContextAccessor { HttpContext = httpContext };
        var currentUserService = new CurrentUserService(accessor);

        currentUserService.UserId.Should().Be(expectedUserId);

        var emptyAccessor = new HttpContextAccessor { HttpContext = new DefaultHttpContext() };
        new CurrentUserService(emptyAccessor).UserId.Should().BeNull();
    }
}
