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

        if (session is null)
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

        var isCheckOut = string.Equals(sessionType, "CHECK_OUT", StringComparison.OrdinalIgnoreCase);
        var hasApprovedCheckIn = false;
        if (isCheckOut)
        {
            hasApprovedCheckIn = await context.Attendances
                .AnyAsync(a => a.ActivityRegistrationId == reg.Id
                            && a.AttendanceSession.Type == "CHECK_IN"
                            && a.Status == "APPROVED", cancellationToken);
        }

        var creditDaysToAward = (isCheckOut && hasApprovedCheckIn)
            ? reg.Activity.CreditDays
            : 0m;

        if (existingAttendance is not null)
        {
            existingAttendance.ApproveManually(userId, now, request.Note);
            if (isCheckOut && hasApprovedCheckIn)
            {
                existingAttendance.CreditEarned = reg.Activity.CreditDays;
            }
        }
        else
        {
            var attendance = Attendance.CreateManual(
                sessionId: session.Id,
                registrationId: reg.Id,
                creditDays: creditDaysToAward,
                reviewerId: userId,
                attendedAt: now,
                note: request.Note
            );
            context.Attendances.Add(attendance);
        }

        // Nếu vừa đánh dấu CHECK_IN thành công và trước đó sinh viên đã có bản ghi CHECK_OUT APPROVED,
        // kích hoạt CreditEarned cho bản ghi CHECK_OUT đó để đủ điều kiện 2/2 lượt
        Attendance? existingCheckOut = null;
        if (!isCheckOut)
        {
            existingCheckOut = await context.Attendances
                .Include(a => a.AttendanceSession)
                .FirstOrDefaultAsync(a => a.ActivityRegistrationId == reg.Id
                                       && a.AttendanceSession.Type == "CHECK_OUT"
                                       && a.Status == "APPROVED", cancellationToken);
            if (existingCheckOut is not null)
            {
                existingCheckOut.CreditEarned = reg.Activity.CreditDays;
            }
        }

        // Tự động ghi vào Sổ cái ngày công (VolunteerCreditRecord) khi hoàn thành đủ 2/2 lượt
        var isBothSessionsCompleted = (isCheckOut && hasApprovedCheckIn) || (!isCheckOut && existingCheckOut is not null);
        if (isBothSessionsCompleted && reg.Activity.CreditDays > 0m)
        {
            var alreadyCredited = await context.VolunteerCreditRecords
                .AnyAsync(c => c.ActivityRegistrationId == reg.Id
                            && c.Status == VolunteerCreditRecord.StatusOfficial, cancellationToken);

            if (!alreadyCredited)
            {
                var creditRecord = VolunteerCreditRecord.CreateForActivityCompletion(
                    volunteerId: reg.VolunteerId,
                    activityId: reg.ActivityId,
                    registrationId: reg.Id,
                    creditDays: reg.Activity.CreditDays,
                    awardedAt: now,
                    activityName: reg.Activity.Name
                );
                creditRecord.AwardedBy = userId;
                creditRecord.Reason = $"Cán bộ xác nhận điểm danh thủ công hoàn tất 2/2 lượt cho hoạt động: {reg.Activity.Name}.";
                context.VolunteerCreditRecords.Add(creditRecord);
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
