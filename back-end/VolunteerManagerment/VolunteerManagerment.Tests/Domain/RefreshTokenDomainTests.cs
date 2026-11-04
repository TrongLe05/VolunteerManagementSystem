using FluentAssertions;
using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Domain.Exceptions;
using Xunit;

namespace VolunteerManagerment.Tests.Domain;

public class RefreshTokenDomainTests
{
    [Fact]
    public void NewRefreshToken_ShouldInheritFromBaseEntity_AndGenerateUniqueId()
    {
        var token1 = new RefreshToken();
        var token2 = new RefreshToken();

        token1.Should().BeAssignableTo<BaseEntity>();
        token1.Id.Should().NotBeEmpty();
        token2.Id.Should().NotBeEmpty();
        token1.Id.Should().NotBe(token2.Id);
        token1.Token.Should().BeEmpty();
        token1.IsRevoked.Should().BeFalse();
        token1.RevokedAt.Should().BeNull();
    }

    [Fact]
    public void IsExpired_WhenExpiresAtIsInFuture_ShouldReturnFalse()
    {
        var token = new RefreshToken
        {
            Token = "valid-refresh-token",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            IsRevoked = false
        };

        token.IsExpired.Should().BeFalse();
    }

    [Fact]
    public void IsExpired_WhenExpiresAtIsInPast_ShouldReturnTrue()
    {
        var token = new RefreshToken
        {
            Token = "expired-refresh-token",
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1),
            IsRevoked = false
        };

        token.IsExpired.Should().BeTrue();
    }

    [Theory]
    [InlineData(false, 10, true)]   // Chưa thu hồi, còn hạn -> Active = true
    [InlineData(true, 10, false)]   // Đã thu hồi, còn hạn -> Active = false
    [InlineData(false, -10, false)] // Chưa thu hồi, hết hạn -> Active = false
    [InlineData(true, -10, false)]  // Đã thu hồi, hết hạn -> Active = false
    public void IsActive_ShouldEvaluateCorrectlyBasedOnRevokedAndExpirationState(
        bool isRevoked,
        int minutesFromNow,
        bool expectedIsActive)
    {
        var token = new RefreshToken
        {
            UserId = Guid.NewGuid(),
            Token = "sample-token",
            IsRevoked = isRevoked,
            RevokedAt = isRevoked ? DateTimeOffset.UtcNow : null,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(minutesFromNow)
        };

        token.IsActive.Should().Be(expectedIsActive);
    }

    [Fact]
    public void Revoke_WhenNotRevoked_ShouldSetIsRevokedAndTimestamp_AndThrowIfRevokedAgain()
    {
        var token = new RefreshToken
        {
            Token = "token-to-revoke",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(5)
        };
        var revokedTime = DateTimeOffset.UtcNow;

        token.Revoke(revokedTime);

        token.IsRevoked.Should().BeTrue();
        token.RevokedAt.Should().Be(revokedTime);
        token.IsActive.Should().BeFalse();

        var actRevokeAgain = () => token.Revoke(revokedTime.AddMinutes(1));
        actRevokeAgain.Should().Throw<DomainException>()
            .WithMessage("*Refresh token đã bị thu hồi trước đó*");
    }

    [Fact]
    public void EnsureActive_ShouldSucceedWhenActive_AndThrowUnauthorizedWhenInactive()
    {
        var activeToken = new RefreshToken
        {
            Token = "active-token",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(1),
            IsRevoked = false
        };
        activeToken.Invoking(t => t.EnsureActive()).Should().NotThrow();

        var expiredToken = new RefreshToken
        {
            Token = "expired-token",
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1),
            IsRevoked = false
        };
        expiredToken.Invoking(t => t.EnsureActive())
            .Should().Throw<UnauthorizedAccessException>()
            .WithMessage("*Refresh token không hợp lệ hoặc đã hết hạn*");
    }
}
