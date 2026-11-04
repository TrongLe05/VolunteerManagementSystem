using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.OpenAttendanceSession;

public class OpenAttendanceSessionCommandHandler(
    IUserRepository userRepository,
    ICurrentUserService currentUserService,
    IActivityRepository activityRepository,
    IOrganizationRepository organizationRepository,
    IAttendanceSessionRepository attendanceSessionRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<OpenAttendanceSessionCommand, Guid>
{
    public async Task<Guid> Handle(OpenAttendanceSessionCommand request, CancellationToken cancellationToken)
    {
        var activity = await activityRepository.GetByIdWithDetailsAsync(request.ActivityId, cancellationToken)
            ?? throw new KeyNotFoundException("Hoạt động không tồn tại.");
       
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        if (roles.Contains("SUPER_ADMIN"))
        {
            // SUPER_ADMIN can open attendance session for any activity
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(activity.Campaign.OrganizationId))
                throw new UnauthorizedAccessException("Bạn không có quyền mở phiên điểm danh cho hoạt động này.");
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền mở phiên điểm danh cho hoạt động này.");
        }

        var hasActiveSession = await attendanceSessionRepository.HasActiveSessionAsync(request.ActivityId, request.Type, cancellationToken);
        if (hasActiveSession)
            throw new InvalidOperationException("Đã tồn tại phiên điểm danh đang mở cho hoạt động này.");

        var now = DateTimeOffset.UtcNow;
        activity.EnsureCanOpenAttendanceSessionAndTransition(now);

        var attendanceSession = new AttendanceSession
        {
            ActivityId = request.ActivityId,
            Type = request.Type,
            StartedAt = now,
            EndedAt = request.DurationMinutes.HasValue ? now.AddMinutes(request.DurationMinutes.Value) : null,
            CreatedAt = now,
            CreatedBy = userId
        };

        await attendanceSessionRepository.AddAsync(attendanceSession, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return attendanceSession.Id;
    }
}
