using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Users.Commands.ToggleUserStatus;

public class ToggleUserStatusCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<ToggleUserStatusCommand, bool>
{
    public async Task<bool> Handle(ToggleUserStatusCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        if (currentUserId == request.Id)
        {
            throw new InvalidOperationException("Bạn không thể tự khóa/mở khóa tài khoản của chính mình.");
        }

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
                throw new UnauthorizedAccessException("Bạn không có quyền thay đổi trạng thái tài khoản.");
            }

            if (targetRoles.Contains("SUPER_ADMIN"))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền khóa tài khoản Quản trị viên cấp cao (SUPER_ADMIN).");
            }

            var allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(currentUser.OrganizationId, cancellationToken);
            if (!allowedOrgIds.Contains(targetUser.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn chỉ có thể quản lý tài khoản thuộc đơn vị do bạn quản lý.");
            }
        }

        targetUser.IsActive = request.IsActive;
        targetUser.UpdatedAt = DateTimeOffset.UtcNow;

        // Also sync volunteer profile status
        var volunteer = await context.Volunteers
            .FirstOrDefaultAsync(v => v.UserId == targetUser.Id, cancellationToken);
        if (volunteer != null)
        {
            volunteer.IsActive = request.IsActive;
            volunteer.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
