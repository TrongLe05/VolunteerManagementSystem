using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Auth.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.RefreshTokens;

public class RefreshTokenCommandHandler(
    IRepository<RefreshToken> refreshTokenRepository,
    IUserRepository userRepository,
    IJwtTokenGenerator jwtTokenGenerator,
    IUnitOfWork unitOfWork
) : IRequestHandler<RefreshTokenCommand, RefreshTokenResponseDto>
{
    public async Task<RefreshTokenResponseDto> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tokens = await refreshTokenRepository.FindAsync(r => r.Token == request.RefreshToken, cancellationToken);

        var existingToken = tokens.FirstOrDefault();

        if (existingToken == null)
            throw new UnauthorizedAccessException("Refresh token không tồn tại!");

        if (existingToken.IsRevoked)
            throw new UnauthorizedAccessException("Refresh token này đã bị thu hồi!");

        if (existingToken.ExpiresAt < DateTimeOffset.UtcNow)
            throw new UnauthorizedAccessException("Refresh token đã hết hạn. Vui lòng đăng nhập lại!");

        var user = await userRepository.GetByIdWithDetailsAsync(existingToken.UserId, cancellationToken);
        if (user == null || !user.IsActive)
            throw new UnauthorizedAccessException("Tài khoản không hợp lệ hoặc đã bị khóa!");

        existingToken.IsRevoked = true;
        existingToken.RevokedAt = DateTimeOffset.UtcNow;
        refreshTokenRepository.Update(existingToken);

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        var newAccessToken = jwtTokenGenerator.GenerateToken(user, roles, user.Organization.Name);
        var newRefreshToken = jwtTokenGenerator.GenerateRefreshToken();

        var newRefreshTokenEntity = new RefreshToken
        {
            Token = newRefreshToken,
            UserId = user.Id,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            IsRevoked = false
        };

        await refreshTokenRepository.AddAsync(newRefreshTokenEntity, cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new RefreshTokenResponseDto(
            AccessToken: newAccessToken,
            RefreshToken: newRefreshToken,
            TokenType: "Bearer",
            ExpiresIn: 24 * 60 * 60
        );
    }
}
