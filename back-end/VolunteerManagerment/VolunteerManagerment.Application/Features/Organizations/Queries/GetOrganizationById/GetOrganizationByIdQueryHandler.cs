using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Organizations.DTOs;

namespace VolunteerManagerment.Application.Features.Organizations.Queries.GetOrganizationById;

public class GetOrganizationByIdQueryHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetOrganizationByIdQuery, OrganizationDto>
{
    public async Task<OrganizationDto> Handle(GetOrganizationByIdQuery request, CancellationToken cancellationToken)
    {
        var org = await organizationRepository.GetByIdAsync(request.Id)
            ?? throw new KeyNotFoundException("Không tìm thấy chổ chức.");

        var userId = currentUserService.UserId 
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");
        
        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (roles.Contains("SUPER_ADMIN"))
        {
            // SUPER_ADMIN can access any organization
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(org.Id))
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập chổ chức này.");
        }

        string? parentName = null;
        if (org.ParentId.HasValue)
        {
            var parent = await organizationRepository.GetByIdAsync(org.ParentId.Value, cancellationToken);
            parentName = parent?.Name;  
        }

        return new OrganizationDto(
            org.Id,
            org.ParentId,
            parentName,
            org.Code,
            org.Name,
            org.Description,
            org.IsActive
        );
    }
}
