using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Campaigns.DTOs;

namespace VolunteerManagerment.Application.Features.Campaigns.Queries.GetCampaigns;

public class GetCampaignsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetCampaignsQuery, PageResult<CampaignDto>>
{
    public async Task<PageResult<CampaignDto>> Handle(GetCampaignsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId 
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");
        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        List<Guid>? allowedOrgs = null;
        if (roles.Contains("SUPER_ADMIN") || roles.Contains("VOLUNTEER"))
        {
            allowedOrgs = null;
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
        }
        else
        {
           throw new UnauthorizedAccessException("Người dùng không có quyền truy cập.");
        }

        var query = context.Campaigns.Include(c => c.Organization).AsNoTracking();
        if (allowedOrgs != null)
        {
            query = query.Where(c => allowedOrgs.Contains(c.OrganizationId));
        }

        if (roles.Contains("VOLUNTEER"))
        {
            query = query.Where(c => c.Status != "DRAFT");
        }

        if (request.OrganizationId.HasValue)
        {
            query = query.Where(c => c.OrganizationId == request.OrganizationId.Value);
        }

        if (request.Status is not null)
        {
            query = query.Where(c => c.Status == request.Status);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();
            query = query.Where(c => c.Name.ToLower().Contains(searchTerm));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query.OrderByDescending(c => c.StartDate)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(c => new CampaignDto(
                c.Id,
                c.Name,
                c.Description,
                c.StartDate,
                c.EndDate,
                c.Status,
                c.OrganizationId,
                c.Organization.Name,
                c.CreatedBy
            ))
            .ToListAsync(cancellationToken);

        return new PageResult<CampaignDto>(items, totalCount, request.PageNumber, request.PageSize);  
    }
}
