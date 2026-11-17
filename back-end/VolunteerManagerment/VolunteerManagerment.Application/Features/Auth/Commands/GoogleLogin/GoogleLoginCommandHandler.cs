using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Auth.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.GoogleLogin;

public class GoogleLoginCommandHandler(
    IGoogleAuthService googleAuthService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IRepository<Role> roleRepository,
    IVolunteerRepository volunteerRepository,
    IRepository<RefreshToken> refreshTokenRepository,
    IPasswordHasher passwordHasher,
    IJwtTokenGenerator jwtTokenGenerator,
    IUnitOfWork unitOfWork
) : IRequestHandler<GoogleLoginCommand, GoogleLoginResponseDto>
{
    public async Task<GoogleLoginResponseDto> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var googleUser = await googleAuthService.VerifyGoogleTokenAsync(request.IdToken, cancellationToken);

        var user = await userRepository.GetByUserNameOrEmailAsync(googleUser.Email, cancellationToken);

        string organizationName;
        List<string> roles;

        if (user is null)
        {
            // gọi lần 1 chưa có tài khoản, trả respones cho FE yêu cầu chọn tổ chức
            if (!request.OrganizationId.HasValue || request.OrganizationId.Value == Guid.Empty)
            {
                return new GoogleLoginResponseDto(
                    RequiresOrganization: true,
                    Email: googleUser.Email,
                    FullName: googleUser.FullName,
                    LoginData: null
                );
            }

            // gọi lần 2, đã chọn tổ chức, tạo mới tài khoản
            var organization = await organizationRepository.GetByIdAsync(request.OrganizationId.Value, cancellationToken)
                ?? throw new InvalidOperationException("Không tìm thấy tổ chức.");

            var volunteerRoles = (await roleRepository.FindAsync(r => r.Code == "VOLUNTEER", cancellationToken)).FirstOrDefault()
                ?? throw new InvalidOperationException("Không tìm thấy vai trò của tình nguyện viên.");

            var baseUsername = googleUser.Email.Split('@')[0];
            var username = baseUsername;

            if (await userRepository.IsUsernameOrEmailExistedAsync(username, googleUser.Email, cancellationToken))
                username = $"{baseUsername}_{Guid.NewGuid().ToString()[..6]}";

            user = new User
            {
                Id = Guid.NewGuid(),
                OrganizationId = organization.Id,
                Username = username,
                Email = googleUser.Email,
                PasswordHash = passwordHasher.HashPassword(Guid.NewGuid().ToString("N")),
                AvatarUrl = googleUser.AvartarUrl,
                IsActive = true,
                LastLoginAt = DateTimeOffset.UtcNow,
                UserRoles =
                    [
                        new UserRole { RoleId = volunteerRoles.Id }
                    ]
            };

            var newVolunteer = new Volunteer
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                FullName = googleUser.FullName,
                OrganizationId = organization.Id,
                VolunteerCode = $"TNV-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
                CreatedAt = DateTimeOffset.UtcNow,
                IsActive = true,
                ConsentFaceAuth = false
            };

            await userRepository.AddAsync(user, cancellationToken);
            await volunteerRepository.AddAsync(newVolunteer, cancellationToken);

            organizationName = organization.Name;
            roles = [volunteerRoles.Code];
        }
        else
        {
            if (!user.IsActive)
                throw new UnauthorizedAccessException("Tài khoản của bạn đã bị vô hiệu hoá. Vui lòng liên hệ ban quản trị.");

            if (string.IsNullOrWhiteSpace(user.AvatarUrl) && !string.IsNullOrWhiteSpace(googleUser.AvartarUrl))
                user.AvatarUrl = googleUser.AvartarUrl;

            user.LastLoginAt = DateTimeOffset.UtcNow;

            organizationName = user.Organization.Name;

            roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();   
        }

        var accessToken = jwtTokenGenerator.GenerateToken(user, roles, organizationName);
        var refreshTokenString = jwtTokenGenerator.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            Token = refreshTokenString,
            UserId = user.Id,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            IsRevoked = false
        };

        await refreshTokenRepository.AddAsync(refreshToken, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var loginData = new LoginResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshTokenString,
            TokenType: "Bearer",
            ExpiresIn: 24 * 60 * 60,
            User: new UserInfo(
                user.Id,
                user.Username,
                user.Email,
                user.AvatarUrl,
                user.OrganizationId,
                organizationName,
                roles
            )
        );

        return new GoogleLoginResponseDto(
            RequiresOrganization: false,
            Email: user.Email,
            FullName: googleUser.FullName,
            LoginData: loginData
        );
    }
}
