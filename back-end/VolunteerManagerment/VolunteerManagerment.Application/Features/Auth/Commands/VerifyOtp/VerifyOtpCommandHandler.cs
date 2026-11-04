using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.VerifyOtp;

public class VerifyOtpCommandHandler(
    IUserRepository userRepository,
    IRepository<PasswordResetToken> passwordResetTokenRepository
) : IRequestHandler<VerifyOtpCommand, bool>
{
    public async Task<bool> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByUserNameOrEmailAsync(request.Email, cancellationToken);
        if (user == null || !user.IsActive)
            throw new InvalidOperationException("Yêu cầu không hợp lệ!");

        var tokens = await passwordResetTokenRepository.FindAsync(
            rt => rt.UserId == user.Id
                && rt.Token == request.Otp
                && !rt.IsUsed,
            cancellationToken
        );

        var resetToken = tokens
            .OrderByDescending(rt => rt.CreatedAt)
            .FirstOrDefault();

        if (resetToken == null || resetToken.ExpiresAt < DateTimeOffset.UtcNow)
            throw new InvalidOperationException("Mã OTP không chính xác hoặc đã hết hạn!");

        // Chỉ xác thực hợp lệ, chưa đánh dấu IsUsed = true (sẽ đánh dấu ở bước ResetPassword)
        return true;
    }
}
