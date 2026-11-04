using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries.GetActivityAttendanceOverview;

public class GetActivityAttendanceOverviewQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetActivityAttendanceOverviewQuery, ActivityAttendanceOverviewDto>
{
    public async Task<ActivityAttendanceOverviewDto> Handle(GetActivityAttendanceOverviewQuery request, CancellationToken cancellationToken)
    {
        var activity = await context.Activities
            .AsNoTracking()
            .Include(a => a.Campaign)
                .ThenInclude(c => c.Organization)
            .FirstOrDefaultAsync(a => a.Id == request.ActivityId, cancellationToken)
            ?? throw new KeyNotFoundException("Hoạt động không tồn tại.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (!roles.Contains("SUPER_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(activity.Campaign.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin điểm danh của hoạt động này.");
            }
        }

        var registrations = await context.ActivityRegistrations
            .AsNoTracking()
            .Include(ar => ar.Volunteer)
            .Include(ar => ar.Attendances)
                .ThenInclude(att => att.AttendanceSession)
            .Where(ar => ar.ActivityId == request.ActivityId && ar.Status != "CANCELLED" && ar.Status != "REJECTED")
            .OrderBy(ar => ar.Volunteer.FullName)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var activeSessionEntity = await context.AttendanceSessions
            .AsNoTracking()
            .Where(s => s.ActivityId == request.ActivityId && (s.EndedAt == null || s.EndedAt > now))
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        ActiveAttendanceSessionDto? activeSessionDto = null;
        if (activeSessionEntity != null)
        {
            var remainingSeconds = activeSessionEntity.EndedAt.HasValue
                ? Math.Max(0, (int)(activeSessionEntity.EndedAt.Value - now).TotalSeconds)
                : 300;

            activeSessionDto = new ActiveAttendanceSessionDto(
                activeSessionEntity.Id,
                activeSessionEntity.ActivityId,
                activity.Name,
                activeSessionEntity.Type,
                activeSessionEntity.StartedAt,
                activeSessionEntity.EndedAt,
                remainingSeconds,
                false
            );
        }

        var volunteerDtos = new List<ActivityVolunteerAttendanceDto>();

        foreach (var reg in registrations)
        {
            var checkInAtt = reg.Attendances
                .Where(a => a.AttendanceSession.Type == "CHECK_IN")
                .OrderByDescending(a => a.AttendedAt)
                .FirstOrDefault();

            var checkOutAtt = reg.Attendances
                .Where(a => a.AttendanceSession.Type == "CHECK_OUT")
                .OrderByDescending(a => a.AttendedAt)
                .FirstOrDefault();

            AttendanceRecordDetailDto? checkInDto = checkInAtt == null ? null : new AttendanceRecordDetailDto(
                checkInAtt.Id,
                checkInAtt.AttendedAt,
                checkInAtt.LocationStatus,
                checkInAtt.LocationAccuracyMeters,
                checkInAtt.VerificationMethod,
                checkInAtt.FaceSimilarity,
                checkInAtt.IsLivenessVerified,
                checkInAtt.CapturedImageUrl,
                checkInAtt.Status
            );

            AttendanceRecordDetailDto? checkOutDto = checkOutAtt == null ? null : new AttendanceRecordDetailDto(
                checkOutAtt.Id,
                checkOutAtt.AttendedAt,
                checkOutAtt.LocationStatus,
                checkOutAtt.LocationAccuracyMeters,
                checkOutAtt.VerificationMethod,
                checkOutAtt.FaceSimilarity,
                checkOutAtt.IsLivenessVerified,
                checkOutAtt.CapturedImageUrl,
                checkOutAtt.Status
            );

            volunteerDtos.Add(new ActivityVolunteerAttendanceDto(
                reg.Id,
                reg.VolunteerId,
                reg.Volunteer.FullName,
                reg.Volunteer.StudentCode,
                reg.Volunteer.ClassName,
                reg.Volunteer.Phone,
                reg.Status,
                checkInDto,
                checkOutDto
            ));
        }

        int totalRegistered = registrations.Count;
        int totalCheckedIn = volunteerDtos.Count(v => v.CheckIn != null);
        int totalCheckedOut = volunteerDtos.Count(v => v.CheckOut != null);
        int totalAttended = volunteerDtos.Count(v => v.CheckIn != null || v.CheckOut != null);
        int totalAbsent = Math.Max(0, totalRegistered - totalAttended);

        return new ActivityAttendanceOverviewDto(
            activity.Id,
            activity.Name,
            activity.Campaign.Name,
            activity.Campaign.Organization.Name,
            activity.StartTime,
            activity.EndTime,
            totalRegistered,
            totalAttended,
            totalCheckedIn,
            totalCheckedOut,
            totalAbsent,
            activeSessionDto,
            volunteerDtos
        );
    }
}
