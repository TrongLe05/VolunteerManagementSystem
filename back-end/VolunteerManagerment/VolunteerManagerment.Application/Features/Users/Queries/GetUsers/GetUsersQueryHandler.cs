using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Users.DTOs;

namespace VolunteerManagerment.Application.Features.Users.Queries.GetUsers;

public class GetUsersQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetUsersQuery, PageResult<UserDto>>
{
    public async Task<PageResult<UserDto>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var currentUser = await userRepository.GetByIdWithDetailsAsync(currentUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = currentUser.UserRoles.Select(ur => ur.Role.Code).ToList();
        List<Guid>? allowedOrgIds = null;

        if (roles.Contains("SUPER_ADMIN"))
        {
            // Super Admin can view all users
            allowedOrgIds = null;
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            // Organization Admin can only view users in their organization tree
            allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(currentUser.OrganizationId, cancellationToken);
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền quản lý tài khoản.");
        }

        var query = context.Users
            .Include(u => u.Organization)
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .AsNoTracking();

        if (allowedOrgIds != null)
        {
            query = query.Where(u => allowedOrgIds.Contains(u.OrganizationId));
        }

        if (request.OrganizationId.HasValue)
        {
            if (allowedOrgIds != null && !allowedOrgIds.Contains(request.OrganizationId.Value))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập đơn vị này.");
            }
            query = query.Where(u => u.OrganizationId == request.OrganizationId.Value);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(u => u.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            var roleCode = request.Role.Trim().ToUpper();
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Code == roleCode));
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            query = query.Where(u =>
                u.Username.ToLower().Contains(term) ||
                u.Email.ToLower().Contains(term) ||
                context.Volunteers.Any(v => v.UserId == u.Id && (
                    v.FullName.ToLower().Contains(term) ||
                    (v.StudentCode != null && v.StudentCode.ToLower().Contains(term)) ||
                    (v.Phone != null && v.Phone.ToLower().Contains(term))
                ))
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pagedUsers = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.OrganizationId,
                OrganizationName = u.Organization.Name,
                u.IsActive,
                u.AvatarUrl,
                u.LastLoginAt,
                u.CreatedAt,
                Roles = u.UserRoles.Select(ur => ur.Role.Code).ToList(),
                Volunteer = context.Volunteers
                    .Where(v => v.UserId == u.Id)
                    .Select(v => new { v.FullName, v.StudentCode, v.Phone })
                    .FirstOrDefault()
            })
            .ToListAsync(cancellationToken);

        var items = pagedUsers.Select(u => new UserDto(
            u.Id,
            u.Username,
            u.Email,
            u.OrganizationId,
            u.OrganizationName,
            u.IsActive,
            u.AvatarUrl,
            u.LastLoginAt,
            u.CreatedAt,
            u.Roles,
            u.Volunteer?.FullName,
            u.Volunteer?.StudentCode,
            u.Volunteer?.Phone
        )).ToList();

        return new PageResult<UserDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
