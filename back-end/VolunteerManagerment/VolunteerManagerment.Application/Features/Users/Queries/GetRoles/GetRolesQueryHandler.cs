using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Users.DTOs;

namespace VolunteerManagerment.Application.Features.Users.Queries.GetRoles;

public class GetRolesQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository
) : IRequestHandler<GetRolesQuery, List<RoleDto>>
{
    public async Task<List<RoleDto>> Handle(GetRolesQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var currentUser = await userRepository.GetByIdWithDetailsAsync(currentUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var isSuperAdmin = currentUser.UserRoles.Any(ur => ur.Role.Code == "SUPER_ADMIN");

        var rolesQuery = context.Roles.AsNoTracking();

        if (!isSuperAdmin)
        {
            // Organization Admin can only manage and assign ORGANIZATION_ADMIN or VOLUNTEER roles
            rolesQuery = rolesQuery.Where(r => r.Code != "SUPER_ADMIN");
        }

        return await rolesQuery
            .Select(r => new RoleDto(r.Id, r.Name, r.Code, r.Description))
            .ToListAsync(cancellationToken);
    }
}
