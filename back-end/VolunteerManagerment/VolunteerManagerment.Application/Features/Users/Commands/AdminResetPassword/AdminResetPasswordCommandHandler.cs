using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Users.Commands.AdminResetPassword;

public class AdminResetPasswordCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IPasswordHasher passwordHasher,
    IUnitOfWork unitOfWork
) : IRequestHandler<AdminResetPasswordCommand, bool>
{
    public async Task<bool> Handle(AdminResetPasswordCommand request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
        {
            throw new InvalidOperationException("Mật khẩu mới phải có ít nhất 6 ký tự.");
        }

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
                throw new UnauthorizedAccessException("Bạn không có quyền đặt lại mật khẩu cho tài khoản này.");
            }

            if (targetRoles.Contains("SUPER_ADMIN"))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền đặt lại mật khẩu của Quản trị viên cấp cao (SUPER_ADMIN).");
            }

            var allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(currentUser.OrganizationId, cancellationToken);
            if (!allowedOrgIds.Contains(targetUser.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn chỉ có thể đặt lại mật khẩu cho tài khoản thuộc đơn vị do bạn quản lý.");
            }
        }

        targetUser.PasswordHash = passwordHasher.HashPassword(request.NewPassword);
        targetUser.UpdatedAt = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
