using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.ManualMarkAttendance;

public class ManualMarkAttendanceCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<ManualMarkAttendanceCommand, bool>
{
    public async Task<bool> Handle(ManualMarkAttendanceCommand request, CancellationToken cancellationToken)
    {
        var reg = await context.ActivityRegistrations
            .Include(r => r.Activity)
                .ThenInclude(a => a.Campaign)
            .FirstOrDefaultAsync(r => r.Id == request.RegistrationId, cancellationToken)
            ?? throw new KeyNotFoundException("Bản ghi đăng ký không tồn tại.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (!roles.Contains("SUPER_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(reg.Activity.Campaign.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền điểm danh cho hoạt động này.");
            }
        }

        var sessionType = request.Type.ToUpperInvariant();
        if (sessionType != "CHECK_IN" && sessionType != "CHECK_OUT")
        {
            sessionType = "CHECK_IN";
        }

        var now = DateTimeOffset.UtcNow;
        var session = await context.AttendanceSessions
            .Where(s => s.ActivityId == reg.ActivityId && s.Type == sessionType)
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (session == null)
        {
            session = new AttendanceSession
            {
                Id = Guid.NewGuid(),
                ActivityId = reg.ActivityId,
                Type = sessionType,
                StartedAt = now,
                EndedAt = now.AddMinutes(30),
                CreatedBy = userId,
                CreatedAt = now
            };
            context.AttendanceSessions.Add(session);
        }

        var existingAttendance = await context.Attendances
            .FirstOrDefaultAsync(a => a.ActivityRegistrationId == reg.Id && a.AttendanceSessionId == session.Id, cancellationToken);

        if (existingAttendance != null)
        {
            existingAttendance.ApproveManually(userId, now, request.Note);
        }
        else
        {
            var attendance = Attendance.CreateManual(
                sessionId: session.Id,
                registrationId: reg.Id,
                creditHours: reg.Activity.CreditHours,
                reviewerId: userId,
                attendedAt: now,
                note: request.Note
            );
            context.Attendances.Add(attendance);
        }

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
