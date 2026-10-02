using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Organizations.Commands.CreateOrganization;

public class CreateOrganizationCommandHandler(
    IOrganizationRepository organizationRepository,
    IUserRepository userRepository,
    ICurrentUserService currentUserService,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateOrganizationCommand, Guid>
{
    public async Task<Guid> Handle(CreateOrganizationCommand request, CancellationToken cancellationToken)
    {
        var exitingOrgs = await organizationRepository.IsCodeExistsAsync(request.Code);
        if (exitingOrgs)
            throw new InvalidOperationException("Mã tổ chức đã tồn tại.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại trong hệ thống.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            if (!request.ParentId.HasValue)
                throw new UnauthorizedAccessException("Bạn không có quyền tạo tổ chức cấp cao nhất.");

            var allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgIds.Contains(request.ParentId.Value))
                throw new UnauthorizedAccessException("Bạn không có quyền tạo tổ chức ngoài phạm vi quản lý của mình.");
        }
        else if (!roles.Contains("SUPER_ADMIN"))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền tạo tổ chức.");
        }

        if (request.ParentId.HasValue)
        {
            var parentOrg = await organizationRepository.GetByIdAsync(request.ParentId.Value, cancellationToken) 
                ?? throw new InvalidOperationException("Tổ chức cha không tồn tại.");
        }

        var newOrg = new Organization
        {
            Id = Guid.NewGuid(),
            ParentId = request.ParentId,
            Code = request.Code,
            Name = request.Name,
            Description = request.Description,
            IsActive = true,
        };

        await organizationRepository.AddAsync(newOrg, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return newOrg.Id;
    }
}
