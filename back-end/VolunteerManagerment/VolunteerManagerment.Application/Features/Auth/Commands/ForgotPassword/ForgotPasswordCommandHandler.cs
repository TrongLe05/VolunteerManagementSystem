using MediatR;
using System.Security.Cryptography;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.ForgotPassword;

public class ForgotPasswordCommandHandler(
    IUserRepository userRepository,
    IRepository<PasswordResetToken> passwordResetTokenRepository,
    IEmailService emailService,
    IUnitOfWork unitOfWork
) : IRequestHandler<ForgotPasswordCommand, bool>
{
    public async Task<bool> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByUserNameOrEmailAsync(request.Email, cancellationToken);

        if (user == null || !user.IsActive) return true;
          
        var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

        var passwordResetToken = new PasswordResetToken
        {
            UserId = user.Id,
            Token = otp,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(15)
        };

        await passwordResetTokenRepository.AddAsync(passwordResetToken, cancellationToken);
        await unitOfWork.SaveChangeAsync(cancellationToken);

        try
        {
            await emailService.SendPasswordResetEmailAsync(user.Email, otp, cancellationToken);
        }
        catch (Exception ex)
        {
               
            throw new InvalidOperationException("Không thể gửi email xác thực lúc này. Vui lòng thử lại sau!", ex);
        }

        return true;
    }
}
