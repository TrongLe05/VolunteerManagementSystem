using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.ResetPassword;

public class ResetPasswordCommandHandler(
    IUserRepository userRepository,
    IRepository<PasswordResetToken> passwordResetTokenRepository,
    IPasswordHasher passwordHasher,
    IRepository<RefreshToken> refreshTokenRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<ResetPasswordCommand, bool>
{
    public async Task<bool> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByUserNameOrEmailAsync(request.Email, cancellationToken);

        if (user == null || !user.IsActive)
            throw new InvalidOperationException("Yêu cầu không hợp lệ!");

        var token = await passwordResetTokenRepository.FindAsync(
            rt => rt.UserId == user.Id
                && rt.Token == request.Otp
                && !rt.IsUsed,
            cancellationToken
        );

        var resetToken = token.FirstOrDefault();
        if (resetToken == null || resetToken.ExpiresAt < DateTimeOffset.UtcNow)
            throw new InvalidOperationException("Mã OTP không chính xác hoặc đã hết hạn!");

        resetToken.IsUsed = true;
        passwordResetTokenRepository.Update(resetToken);

        user.PasswordHash = passwordHasher.HashPassword(request.NewPassword);
        userRepository.Update(user);

        var activeRefreshTokens = await refreshTokenRepository.FindAsync(rt => rt.UserId == user.Id && !rt.IsRevoked, cancellationToken);
        foreach (var refreshToken in activeRefreshTokens)
        {
            refreshToken.IsRevoked = true;
            refreshToken.RevokedAt = DateTimeOffset.UtcNow;
            refreshTokenRepository.Update(refreshToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
