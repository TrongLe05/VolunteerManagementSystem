using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Auth.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandHandler(
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IRepository<RefreshToken> refreshTokenRepository,
    IJwtTokenGenerator jwtTokenGenerator
    ) : IRequestHandler<LoginCommand, LoginResponseDto>
{
    public async Task<LoginResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // tìm người dùng theo username hoặc email
        var user = await userRepository.GetByUserNameOrEmailAsync(request.UsernameOrEmail, cancellationToken);

        if (user == null || !passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Tài khoản không tồn tại hoặc mật khẩu không chính xác!");

        if (!user.IsActive) 
            throw new UnauthorizedAccessException("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị!");

        // lấy danh sách tên role
        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        // tạo JWT token
        var token = jwtTokenGenerator.GenerateToken(user, roles, user.Organization.Name);

        var refreshTokenString = jwtTokenGenerator.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = refreshTokenString,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7), // Hạn 7 ngày
            IsRevoked = false
        };

        await refreshTokenRepository.AddAsync(refreshToken, cancellationToken);

        // cập nhật thời gian đăng nhập gần nhất
        user.LastLoginAt = DateTimeOffset.UtcNow;
        //await unitOfWork.SaveChangeAsync(cancellationToken);
        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateException ex)
        {
            // Bắt và in thẳng lỗi từ PostgreSQL ra
            throw new Exception(ex.InnerException?.Message ?? ex.Message);
        }

        // trả kết về DTO kết quả
        return new LoginResponseDto(
            AccessToken: token,
            RefreshToken: refreshTokenString,
            TokenType: "Bearer",
            ExpiresIn: 24 * 60 * 60,
            User: new UserInfo(
                user.Id,
                user.Username,
                user.Email,
                user.Organization.Name,
                roles
            )
        );
    }
}
