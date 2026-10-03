using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

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
            throw new UnauthorizedAccessException("Mã tổ chức đã được sử dụng.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);

            if(!request.ParentId.HasValue)
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật tổ chức thành tổ chức cấp cao hơn.");
            
            if (!allowedOrgs.Contains(request.Id))
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật tổ chức ngoài phạm vi quản lý của mình.");
        }
        else if (!roles.Contains("SUPER_ADMIN"))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật tổ chức.");
        }

        var currentOrgs = await organizationRepository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new UnauthorizedAccessException("Tổ chức không tồn tại.");

        currentOrgs.ParentId = request.ParentId;
        currentOrgs.Code = request.Code;
        currentOrgs.Name = request.Name;
        currentOrgs.Description = request.Description;
        currentOrgs.IsActive = request.IsActive;

        organizationRepository.Update(currentOrgs);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
