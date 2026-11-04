using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries.GetAttendanceSessions;

public class GetAttendanceSessionsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetAttendanceSessionsQuery, PageResult<AttendanceSessionItemDto>>
{
    public async Task<PageResult<AttendanceSessionItemDto>> Handle(GetAttendanceSessionsQuery request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var currentUser = await userRepository.GetByIdWithDetailsAsync(currentUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = currentUser.UserRoles.Select(ur => ur.Role.Code).ToList();
        List<Guid>? allowedOrgIds = null;

        if (!roles.Contains("SUPER_ADMIN"))
        {
            if (roles.Contains("ORGANIZATION_ADMIN"))
            {
                allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(currentUser.OrganizationId, cancellationToken);
            }
            else
            {
                throw new UnauthorizedAccessException("Bạn không có quyền quản lý phiên điểm danh.");
            }
        }

        var query = context.AttendanceSessions
            .Include(s => s.Activity)
                .ThenInclude(a => a.Campaign)
                    .ThenInclude(c => c.Organization)
            .Include(s => s.Creator)
            .AsNoTracking();

        if (allowedOrgIds != null)
        {
            query = query.Where(s => allowedOrgIds.Contains(s.Activity.Campaign.OrganizationId));
        }

        if (request.ActivityId.HasValue)
        {
            query = query.Where(s => s.ActivityId == request.ActivityId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;

        var items = await query
            .OrderByDescending(s => s.StartedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(s => new AttendanceSessionItemDto(
                s.Id,
                s.ActivityId,
                s.Activity.Name,
                s.Activity.Campaign.OrganizationId,
                s.Activity.Campaign.Organization.Name,
                s.Type,
                s.StartedAt,
                s.EndedAt,
                s.EndedAt == null || s.EndedAt > now,
                s.EndedAt.HasValue && s.EndedAt > now ? Math.Max(0, (int)(s.EndedAt.Value - now).TotalSeconds) : 0,
                s.Attendances.Count,
                s.Creator.Username
            ))
            .ToListAsync(cancellationToken);

        return new PageResult<AttendanceSessionItemDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
