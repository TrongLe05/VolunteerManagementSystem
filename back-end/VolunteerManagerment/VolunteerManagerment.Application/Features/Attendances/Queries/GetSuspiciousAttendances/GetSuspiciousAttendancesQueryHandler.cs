using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries.GetSuspiciousAttendances;

public sealed class GetSuspiciousAttendancesQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
)
: IRequestHandler<GetSuspiciousAttendancesQuery, PageResult<SuspiciousAttendanceDto>>
{
    public async Task<PageResult<SuspiciousAttendanceDto>> Handle(GetSuspiciousAttendancesQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Không tìm thấy người dùng.");

        var roles = user.UserRoles.Select(r => r.Role.Code).ToList();

        List<Guid>? allowedOrgs = null;

        if (roles.Contains("SUPER_ADMIN"))
        {
            allowedOrgs = null; // SUPER_ADMIN có quyền truy cập tất cả các tổ chức
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập.");
        }

        var query = context.Attendances.AsNoTracking().Where(a => a.LocationStatus == "INVALID" || a.Status == "PENDING");

        if (allowedOrgs != null)
        {
            query = query.Where(a => allowedOrgs.Contains(a.ActivityRegistration.Activity.Campaign.OrganizationId));
        }

        var statusUpper = request.Status?.ToUpperInvariant();
        if (!string.IsNullOrWhiteSpace(request.Status) && request.Status != "ALL")
        {
            query = query.Where(a => a.Status == statusUpper);
        }

        if (request.ActivityId.HasValue)
        {
            query = query.Where(a => a.ActivityRegistration.ActivityId == request.ActivityId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLowerInvariant();
            query = query.Where(a =>
                a.ActivityRegistration.Volunteer.FullName.ToLower().Contains(searchTerm) ||
                (a.ActivityRegistration.Volunteer.StudentCode != null &&
                a.ActivityRegistration.Volunteer.StudentCode.Contains(searchTerm)) ||
                a.ActivityRegistration.Activity.Name.ToLower().Contains(searchTerm)
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;

        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = await query
            .OrderByDescending(a => a.AttendedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new SuspiciousAttendanceDto(
                a.Id,
                a.ActivityRegistration.ActivityId,
                a.ActivityRegistration.Activity.Name,
                a.ActivityRegistration.Activity.Campaign.Organization.Name,
                a.ActivityRegistration.VolunteerId,
                a.ActivityRegistration.Volunteer.FullName,
                a.ActivityRegistration.Volunteer.StudentCode,
                a.AttendanceSession.Type,
                a.AttendedAt,
                a.Latitude,
                a.Longitude,
                a.LocationAccuracyMeters,
                a.LocationStatus,
                a.Status,
                a.CapturedImageUrl,
                a.Note,
                a.ReviewedAt,
                a.Reviewer != null ? a.Reviewer.Email : null
            ))
            .ToListAsync(cancellationToken);

        return new PageResult<SuspiciousAttendanceDto>(items, totalCount, pageNumber, pageSize);
    }
}
