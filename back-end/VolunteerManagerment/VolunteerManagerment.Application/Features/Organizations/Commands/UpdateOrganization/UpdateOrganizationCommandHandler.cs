using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Organizations.Commands.UpdateOrganization;

public class UpdateOrganizationCommandHandler(
     IOrganizationRepository organizationRepository,
     ICurrentUserService currentUserService,
     IUserRepository userRepository,
     IUnitOfWork unitOfWork
) : IRequestHandler<UpdateOrganizationCommand, bool>
{
    public async Task<bool> Handle(UpdateOrganizationCommand request, CancellationToken cancellationToken)
    {
        var existingOrgs = await organizationRepository.IsCodeExistsAsync(request.Code, request.Id, cancellationToken);
        if (existingOrgs)
            throw new InvalidOperationException("Mã tổ chức đã được sử dụng.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var currentOrgs = await organizationRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Tổ chức không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (roles.Contains("SUPER_ADMIN"))
        {
            // Super admin can update any organization
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);

            if (!allowedOrgs.Contains(request.Id))
                throw new InvalidOperationException("Bạn không có quyền cập nhật tổ chức ngoài phạm vi quản lý của mình.");

            if (currentOrgs.ParentId.HasValue && !request.ParentId.HasValue)
                throw new InvalidOperationException("Bạn không có quyền cập nhật tổ chức thành tổ chức cấp cao nhất.");
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật tổ chức.");
        }

        currentOrgs.ParentId = request.ParentId;
        currentOrgs.Code = request.Code.Trim();
        currentOrgs.Name = request.Name.Trim();
        currentOrgs.Description = request.Description?.Trim();
        currentOrgs.IsActive = request.IsActive;
        currentOrgs.UpdatedAt = DateTimeOffset.UtcNow;

        organizationRepository.Update(currentOrgs);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
