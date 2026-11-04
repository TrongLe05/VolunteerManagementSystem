using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Users.Commands.UpdateUser;

public class UpdateUserCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateUserCommand, bool>
{
    public async Task<bool> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var currentUser = await userRepository.GetByIdWithDetailsAsync(currentUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var currentUserRoles = currentUser.UserRoles.Select(ur => ur.Role.Code).ToList();
        var isSuperAdmin = currentUserRoles.Contains("SUPER_ADMIN");

        var targetUser = await context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy tài khoản người dùng.");

        var targetRoles = targetUser.UserRoles.Select(ur => ur.Role.Code).ToList();

        if (!isSuperAdmin)
        {
            if (!currentUserRoles.Contains("ORGANIZATION_ADMIN"))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa tài khoản.");
            }

            // Organization Admin cannot edit Super Admin
            if (targetRoles.Contains("SUPER_ADMIN"))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa tài khoản Quản trị viên cấp cao (SUPER_ADMIN).");
            }

            // Organization Admin cannot grant Super Admin role
            if (request.RoleCodes.Any(r => r.Equals("SUPER_ADMIN", StringComparison.OrdinalIgnoreCase)))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền gán vai trò Quản trị viên cấp cao (SUPER_ADMIN).");
            }

            var allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(currentUser.OrganizationId, cancellationToken);
            if (!allowedOrgIds.Contains(targetUser.OrganizationId) || !allowedOrgIds.Contains(request.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn chỉ có thể quản lý tài khoản thuộc đơn vị do bạn quản trị.");
            }
        }
        else
        {
            // Super admin editing self cannot remove SUPER_ADMIN or deactivate self
            if (targetUser.Id == currentUserId)
            {
                if (!request.IsActive)
                {
                    throw new InvalidOperationException("Bạn không thể tự khóa tài khoản của chính mình.");
                }
                if (!request.RoleCodes.Any(r => r.Equals("SUPER_ADMIN", StringComparison.OrdinalIgnoreCase)))
                {
                    throw new InvalidOperationException("Bạn không thể tự xóa quyền Quản trị viên cấp cao của chính mình.");
                }
            }
        }

        var normalizedEmail = request.Email.Trim().ToLower();
        var isEmailExists = await context.Users
            .AnyAsync(u => u.Id != targetUser.Id && u.Email.ToLower() == normalizedEmail, cancellationToken);
        if (isEmailExists)
        {
            throw new InvalidOperationException($"Địa chỉ email '{request.Email.Trim()}' đã được tài khoản khác sử dụng.");
        }

        var orgExists = await context.Organizations
            .AnyAsync(o => o.Id == request.OrganizationId, cancellationToken);
        if (!orgExists)
        {
            throw new InvalidOperationException("Đơn vị tổ chức đã chọn không tồn tại.");
        }

        var normalizedRoleCodes = request.RoleCodes
            .Select(r => r.Trim().ToUpper())
            .Distinct()
            .ToList();

        var validRoles = await context.Roles
            .Where(r => normalizedRoleCodes.Contains(r.Code.ToUpper()))
            .ToListAsync(cancellationToken);

        if (validRoles.Count == 0)
        {
            throw new InvalidOperationException("Không tìm thấy vai trò hợp lệ nào trong hệ thống.");
        }

        targetUser.Email = request.Email.Trim();
        targetUser.OrganizationId = request.OrganizationId;
        targetUser.IsActive = request.IsActive;
        targetUser.UpdatedAt = DateTimeOffset.UtcNow;

        // Sync Roles
        var currentRoleIds = targetUser.UserRoles.Select(ur => ur.RoleId).ToList();
        var desiredRoleIds = validRoles.Select(r => r.Id).ToList();

        var rolesToRemove = targetUser.UserRoles
            .Where(ur => !desiredRoleIds.Contains(ur.RoleId))
            .ToList();

        foreach (var role in rolesToRemove)
        {
            context.UserRoles.Remove(role);
        }

        var rolesToAdd = validRoles
            .Where(r => !currentRoleIds.Contains(r.Id))
            .Select(r => new UserRole
            {
                UserId = targetUser.Id,
                RoleId = r.Id
            })
            .ToList();

        foreach (var newRole in rolesToAdd)
        {
            await context.UserRoles.AddAsync(newRole, cancellationToken);
        }

        // Sync Volunteer Profile if exists or if role is volunteer
        var volunteer = await context.Volunteers
            .FirstOrDefaultAsync(v => v.UserId == targetUser.Id, cancellationToken);

        if (volunteer != null)
        {
            if (!string.IsNullOrWhiteSpace(request.FullName))
                volunteer.FullName = request.FullName.Trim();
            if (request.StudentCode != null)
                volunteer.StudentCode = request.StudentCode.Trim();
            if (request.Phone != null)
                volunteer.Phone = request.Phone.Trim();
            volunteer.OrganizationId = targetUser.OrganizationId;
            volunteer.IsActive = targetUser.IsActive;
            volunteer.UpdatedAt = DateTimeOffset.UtcNow;
        }
        else if (validRoles.Any(r => r.Code == "VOLUNTEER") || !string.IsNullOrWhiteSpace(request.FullName))
        {
            var newVol = new Volunteer
            {
                Id = Guid.NewGuid(),
                UserId = targetUser.Id,
                OrganizationId = targetUser.OrganizationId,
                VolunteerCode = !string.IsNullOrWhiteSpace(request.StudentCode)
                    ? request.StudentCode.Trim()
                    : $"TNV{DateTimeOffset.UtcNow:yyMMddHHmmss}",
                FullName = !string.IsNullOrWhiteSpace(request.FullName)
                    ? request.FullName.Trim()
                    : targetUser.Username,
                StudentCode = request.StudentCode?.Trim(),
                Phone = request.Phone?.Trim(),
                IsActive = targetUser.IsActive,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            await context.Volunteers.AddAsync(newVol, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
