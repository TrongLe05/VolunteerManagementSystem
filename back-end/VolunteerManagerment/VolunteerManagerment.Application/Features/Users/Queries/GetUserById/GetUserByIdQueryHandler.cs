using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Users.DTOs;

namespace VolunteerManagerment.Application.Features.Users.Queries.GetUserById;

public class GetUserByIdQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetUserByIdQuery, UserDto>
{
    public async Task<UserDto> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var currentUser = await userRepository.GetByIdWithDetailsAsync(currentUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var targetUser = await context.Users
            .Include(u => u.Organization)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản người dùng.");

        var roles = currentUser.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (!roles.Contains("SUPER_ADMIN"))
        {
            if (roles.Contains("ORGANIZATION_ADMIN"))
            {
                var allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(currentUser.OrganizationId, cancellationToken);
                if (!allowedOrgIds.Contains(targetUser.OrganizationId))
                {
                    throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin tài khoản thuộc đơn vị này.");
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin tài khoản này.");
            }
        }

        var volunteer = await context.Volunteers
            .Where(v => v.UserId == targetUser.Id)
            .Select(v => new { v.FullName, v.StudentCode, v.Phone })
            .FirstOrDefaultAsync(cancellationToken);

        return new UserDto(
            targetUser.Id,
            targetUser.Username,
            targetUser.Email,
            targetUser.OrganizationId,
            targetUser.Organization.Name,
            targetUser.IsActive,
            targetUser.AvatarUrl,
            targetUser.LastLoginAt,
            targetUser.CreatedAt,
            targetUser.UserRoles.Select(ur => ur.Role.Code).ToList(),
            volunteer?.FullName,
            volunteer?.StudentCode,
            volunteer?.Phone
        );
    }
}
