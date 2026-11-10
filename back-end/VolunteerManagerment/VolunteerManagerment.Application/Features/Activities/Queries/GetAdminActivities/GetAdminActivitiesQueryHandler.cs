using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetAdminActivities;

public class GetAdminActivitiesQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetAdminActivitiesQuery, PageResult<ActivityDto>>
{
    public async Task<PageResult<ActivityDto>> Handle(GetAdminActivitiesQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId 
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");
        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        List<Guid>? allowedOrgs = null;

        if (roles.Contains("SUPER_ADMIN"))
        {
            allowedOrgs = null;
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            // Chỉ hiển thị các hoạt động thuộc cây con của đơn vị mình quản lý (đơn vị mình và các đơn vị cấp con)
            // Không bao gồm các đơn vị cấp trên (Ancestors/Root) hoặc các đơn vị ngang hàng khác
            allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
        }
        else
        {
            throw new UnauthorizedAccessException("Người dùng không có quyền truy cập.");
        }

        var query = context.Activities
            .Include(a => a.Campaign)
                .ThenInclude(c => c.Organization)
            .Include(a => a.Locations)
            .AsNoTracking();

        if (allowedOrgs != null)
        {
            query = query.Where(a => allowedOrgs.Contains(a.Campaign.OrganizationId));
        }

        if (request.CampaignId.HasValue)
        {
            query = query.Where(a => a.CampaignId == request.CampaignId.Value);
        }

        if (request.OrganizationId.HasValue)
        {
            query = query.Where(a => a.Campaign.OrganizationId == request.OrganizationId.Value);
        }

        if (request.Status is not null)
        {
            query = query.Where(a => a.Status == request.Status);
        }

        if (string.IsNullOrWhiteSpace(request.SearchTerm) is false)
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();
            query = query.Where(a =>
                a.Name.ToLower().Contains(searchTerm) ||
                (a.Description != null && a.Description.ToLower().Contains(searchTerm))
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(a => a.StartTime)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(a => new ActivityDto(
                a.Id,
                a.CampaignId,
                a.Campaign.Name,
                a.Campaign.OrganizationId,
                a.Campaign.Organization.Name,
                a.Name,
                a.Description,
                a.StartTime,
                a.EndTime,
                a.Capacity,
                a.CreditDays,
                a.Status,
                a.CreatedBy,
                a.Registrations.Count(r => r.Status == "APPROVED" || r.Status == "REGISTERED"),
                a.Locations.Select(l => new ActivityLocationDto(
                    l.Id,
                    l.ActivityId,
                    l.Name,
                    l.Address,
                    l.Latitude,
                    l.Longitude,
                    l.AllowedRadiusMeters
                )).ToList()
            )).ToListAsync(cancellationToken);

        return new PageResult<ActivityDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
