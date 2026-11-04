using FluentAssertions;
using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Domain.Exceptions;
using Xunit;

namespace VolunteerManagerment.Tests.Domain;

public class PasswordResetTokenDomainTests
{
    [Fact]
    public void NewPasswordResetToken_ShouldHaveDefaultCreatedAtAndUniqueId()
    {
        var token = new PasswordResetToken();

        token.Should().BeAssignableTo<BaseEntity>();
        token.Id.Should().NotBeEmpty();
        token.Token.Should().BeEmpty();
        token.IsUsed.Should().BeFalse();
        token.CreatedAt.Should().BeCloseTo(DateTimeOffset.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public void IsValid_ShouldEvaluateCorrectlyForUnusedUsedAndExpiredTokens()
    {
        var validToken = new PasswordResetToken
        {
            UserId = Guid.NewGuid(),
            Token = "654321",
            IsUsed = false,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15)
        };
        validToken.IsValid.Should().BeTrue();

        var usedToken = new PasswordResetToken
        {
            UserId = Guid.NewGuid(),
            Token = "654321",
            IsUsed = true,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15)
        };
        usedToken.IsValid.Should().BeFalse();

        var expiredToken = new PasswordResetToken
        {
            UserId = Guid.NewGuid(),
            Token = "654321",
            IsUsed = false,
            ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(-5)
        };
        expiredToken.IsValid.Should().BeFalse();
    }

    [Fact]
    public void MarkAsUsed_ShouldSetIsUsedTrue_AndThrowWhenAlreadyUsedOrExpired()
    {
        var now = DateTimeOffset.UtcNow;
        var token = new PasswordResetToken
        {
            UserId = Guid.NewGuid(),
            Token = "123456",
            IsUsed = false,
            ExpiresAt = now.AddMinutes(10)
        };

        token.MarkAsUsed(now);
        token.IsUsed.Should().BeTrue();

        // Dùng lại mã OTP đã sử dụng -> ném DomainException
        var actUsedAgain = () => token.MarkAsUsed(now.AddMinutes(1));
        actUsedAgain.Should().Throw<DomainException>()
            .WithMessage("*Mã xác thực OTP đã được sử dụng*");

        // Mã OTP đã hết hạn -> ném DomainException
        var expiredToken = new PasswordResetToken
        {
            UserId = Guid.NewGuid(),
            Token = "999999",
            IsUsed = false,
            ExpiresAt = now.AddMinutes(-1)
        };
        var actExpired = () => expiredToken.MarkAsUsed(now);
        actExpired.Should().Throw<DomainException>()
            .WithMessage("*Mã xác thực OTP đã hết hạn*");
    }
}
