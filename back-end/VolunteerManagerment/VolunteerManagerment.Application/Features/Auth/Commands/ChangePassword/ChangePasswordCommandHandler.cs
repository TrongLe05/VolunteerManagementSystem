using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.ChangePassword;

public class ChangePasswordCommandHandler(
    ICurrentUserService currentUserService,
    IPasswordHasher passwordHasher,
    IRepository<RefreshToken> refreshTokenRepository,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<ChangePasswordCommand, bool>
{
    public async Task<bool> Handle(ChangePasswordCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng");

        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("Người dùng không tồn tại trong hệ thống");

        var isCurrentPasswordValid = passwordHasher.VerifyPassword(user.PasswordHash, request.CurrentPassword);
        if (!isCurrentPasswordValid)
            throw new InvalidOperationException("Mật khẩu hiện tại không chính xác");

        user.PasswordHash = passwordHasher.HashPassword(request.NewPassword);
        userRepository.Update(user);

        var userToken = await refreshTokenRepository.FindAsync(rt => rt.UserId == userId && !rt.IsRevoked, cancellationToken);
        foreach (var token in userToken)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTimeOffset.UtcNow;
            refreshTokenRepository.Update(token);
        }

        await unitOfWork.SaveChangeAsync(cancellationToken);
        return true;
    }
}
