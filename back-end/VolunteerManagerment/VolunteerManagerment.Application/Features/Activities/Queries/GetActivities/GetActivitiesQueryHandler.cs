using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetActivities;

public class GetActivitiesQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetActivitiesQuery, PageResult<ActivityDto>>
{
    public async Task<PageResult<ActivityDto>> Handle(GetActivitiesQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        List<Guid>? allowOrgs = null;
        var hideDraft = true;

        if (userId.HasValue)
        {
            var user = await userRepository.GetByIdWithDetailsAsync(userId.Value, cancellationToken)
                ?? throw new InvalidOperationException("Người dùng không tồn tại.");

            var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

            if (roles.Contains("SUPER_ADMIN"))
            {
                allowOrgs = null;
                hideDraft = false;
            }
            else if (roles.Contains("ORGANIZATION_ADMIN"))
            {
                // Cho phép xem các hoạt động thuộc cây con của đơn vị mình VÀ các đơn vị cấp trên (Root / Ancestors)
                allowOrgs = await organizationRepository.GetVisibleOrganizationIdsAsync(user.OrganizationId, cancellationToken);
                hideDraft = false;
            }
            else if (roles.Contains("VOLUNTEER"))
            {
                // Tình nguyện viên xem các hoạt động thuộc cây con của đơn vị mình VÀ các đơn vị cấp trên (Root / Ancestors)
                allowOrgs = await organizationRepository.GetVisibleOrganizationIdsAsync(user.OrganizationId, cancellationToken);
                hideDraft = true;
            }
            else
            {
                throw new UnauthorizedAccessException("Người dùng không có quyền truy cập.");
            }
        }

        var query = context.Activities
            .Include(a => a.Campaign)
                .ThenInclude(c => c.Organization)
            .Include(a => a.Locations)
            .AsNoTracking();

        if (allowOrgs != null)
        {
            query = query.Where(a => allowOrgs.Contains(a.Campaign.OrganizationId));
        }

        if (hideDraft)
        {
            query = query.Where(a => a.Status != "DRAFT");
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
                a.CreditHours,
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
