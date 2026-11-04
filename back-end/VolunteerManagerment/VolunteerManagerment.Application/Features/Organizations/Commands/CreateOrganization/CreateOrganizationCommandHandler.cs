using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Organizations.Commands.CreateOrganization;

public class CreateOrganizationCommandHandler(
    IOrganizationRepository organizationRepository,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateOrganizationCommand, Guid>
{
    public async Task<Guid> Handle(CreateOrganizationCommand request, CancellationToken cancellationToken)
    {
        var isCodeExists = await organizationRepository.IsCodeExistsAsync(request.Code, cancellationToken: cancellationToken);
        if (isCodeExists)
            throw new InvalidOperationException("Mã tổ chức đã tồn tại.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        if (roles.Contains("SUPER_ADMIN"))
        {
            // Super admin can create any organization
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            if (!request.ParentId.HasValue)
                throw new InvalidOperationException("Tổ chức con phải có tổ chức cấp trên.");

            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(request.ParentId.Value))
                throw new InvalidOperationException("Bạn không có quyền tạo tổ chức dưới đơn vị này.");
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền thực hiện thao tác này.");
        }

        if (request.ParentId.HasValue)
        {
            var parentOrg = await organizationRepository.GetByIdAsync(request.ParentId.Value, cancellationToken);
            if (parentOrg == null || !parentOrg.IsActive)
                throw new InvalidOperationException("Tổ chức cha không tồn tại hoặc đã ngừng hoạt động.");
        }

        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            ParentId = request.ParentId,
            Code = request.Code.Trim(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await organizationRepository.AddAsync(organization, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return organization.Id;
    }
}
