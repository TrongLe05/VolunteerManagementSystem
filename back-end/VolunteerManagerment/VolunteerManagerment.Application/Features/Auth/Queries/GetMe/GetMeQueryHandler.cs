using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Auth.DTOs;

namespace VolunteerManagerment.Application.Features.Auth.Query.GetMe;

public class GetMeQueryHandler(
    IUserRepository userRepository,
    ICurrentUserService currentUserService
) : IRequestHandler<GetMeQuery, GetMeResponseDto>
{
    public async Task<GetMeResponseDto> Handle(GetMeQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại trong hệ thống.");

        if(!user.IsActive)
            throw new UnauthorizedAccessException("Tài khoản đã bị vô hiệu hóa!");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        return new GetMeResponseDto(
            user.Id,
            user.Username,
            user.Email,
            user.OrganizationId,
            user.Organization.Name,
            user.AvatarUrl = user.AvatarUrl ?? string.Empty,
            roles
        );

    }
}
