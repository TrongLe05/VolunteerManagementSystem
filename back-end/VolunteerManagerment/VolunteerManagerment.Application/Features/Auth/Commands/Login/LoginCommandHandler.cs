using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Features.Auth.DTOs;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandHandler(
    IApplicationDbContext context,
    IJwtTokenGenerator jwtTokenGenerator
    ) : IRequestHandler<LoginCommand, LoginResponseDto>
{
    public async Task<LoginResponseDto> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // tìm người dùng theo username hoặc email
        var user = await context.Users
            .Include(u => u.Organization)
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Username == request.UsernameOrEmail || u.Email == request.UsernameOrEmail, cancellationToken);

        if (user == null || !user.IsActive)
            throw new UnauthorizedAccessException("Tài khoản không tồn tại hoặc bị khoá!");

        // kiểm tra mật khẩu
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid) 
            throw new UnauthorizedAccessException("Mật khẩu không chính xác!");

        // lấy danh sách tên role
        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        // tạo JWT token
        var token = jwtTokenGenerator.GenerateToken(user, roles, user.Organization.Name);

        // cập nhật thời gian đăng nhập gần nhất
        user.LastLoginAt = DateTimeOffset.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        // trả kết về DTO kết quả
        return new LoginResponseDto(
            AccessToken: token,
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
