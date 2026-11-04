using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Organizations.Commands.DeleteOrganization;

public class DeleteOrganizationCommandHandler(
    IOrganizationRepository organizationRepository,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<DeleteOrganizationCommand, bool>
{
    public async Task<bool> Handle(DeleteOrganizationCommand request, CancellationToken cancellationToken)
    {
        var existedOrgs = await organizationRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new InvalidOperationException("Tổ chức không tồn tại.");

        var userId = currentUserService.UserId;
        if (userId is null)
            throw new InvalidOperationException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId.Value, cancellationToken)
            ?? throw new InvalidOperationException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (roles.Contains("SUPER_ADMIN"))
        {
            // Super admin can delete any non-root organization
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);

            if (!allowedOrgs.Contains(request.Id))
                throw new InvalidOperationException("Bạn không có quyền xóa tổ chức ngoài phạm vi quản lý của mình.");
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xóa tổ chức.");
        }

        if (!existedOrgs.ParentId.HasValue)
            throw new InvalidOperationException("Không thể xóa tổ chức cao nhất của hệ thống.");

        var activeChildren = await organizationRepository.FindAsync(o => o.ParentId == request.Id && o.IsActive, cancellationToken);
        if (activeChildren.Any())
            throw new InvalidOperationException("Không thể xóa tổ chức vì còn tổ chức con đang hoạt động.");

        existedOrgs.IsActive = false;
        existedOrgs.UpdatedAt = DateTimeOffset.UtcNow;

        organizationRepository.Update(existedOrgs);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
