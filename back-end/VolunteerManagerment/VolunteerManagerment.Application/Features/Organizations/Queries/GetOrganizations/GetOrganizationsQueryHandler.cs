using MediatR;
using System.Xml.Linq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Organizations.DTOs;

namespace VolunteerManagerment.Application.Features.Organizations.Queries.GetOrganizations;

public class GetOrganizationsQueryHandler(
    IOrganizationRepository organizationRepository,
    IUserRepository userRepository,
    ICurrentUserService currentUserService
) : IRequestHandler<GetOrganizationsQuery, List<OrganizationDto>>
{
    public async Task<List<OrganizationDto>> Handle(GetOrganizationsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        List<Guid>? allowedOrgIds = null;

        if (userId.HasValue)
        {
            var user = await userRepository.GetByIdWithDetailsAsync(userId.Value, cancellationToken);
            if (user != null)
            {
                var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

                if (roles.Contains("SUPER_ADMIN"))
                {
                    // SUPER_ADMIN can access all organizations
                    allowedOrgIds = null;
                }
                else if (roles.Contains("ORGANIZATION_ADMIN"))
                {
                    // ORGANIZATION_ADMIN can only manage and see their own organization and sub-organizations
                    allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);    
                }
            }
        }

        var allOrgs = (await organizationRepository.GetAllAsync(cancellationToken)).ToList();

        if (allowedOrgIds != null)
        {
            allOrgs = allOrgs.Where(org => allowedOrgIds.Contains(org.Id)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var term = request.SearchTerm.Trim().ToLower();
            allOrgs = allOrgs.Where(o => o.Name.ToLower().Contains(term) || (o.Description != null && o.Description.ToLower().Contains(term))).ToList();
        }

        var orgMap = allOrgs.ToDictionary(o => o.Id, o => o.Name);

        return allOrgs.Select(o => new OrganizationDto(
            o.Id,
            o.ParentId,
            o.ParentId.HasValue && orgMap.ContainsKey(o.ParentId.Value) ? orgMap[o.ParentId.Value] : null,
            o.Code,
            o.Name,
            o.Description,
            o.IsActive
        )).ToList();
    }
}
