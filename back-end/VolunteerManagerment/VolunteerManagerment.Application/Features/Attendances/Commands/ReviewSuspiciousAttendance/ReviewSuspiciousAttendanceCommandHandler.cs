using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.ReviewSuspiciousAttendance;

public sealed class ReviewSuspiciousAttendanceCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<ReviewSuspiciousAttendanceCommand, bool>
{
    public async Task<bool> Handle(ReviewSuspiciousAttendanceCommand request, CancellationToken cancellationToken)
    {
        var reviewerId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var reviewer = await userRepository.GetByIdWithDetailsAsync(reviewerId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = reviewer.UserRoles.Select(ur => ur.Role.Code).ToList();

        List<Guid>? allowedOrgs = null;

        if (roles.Contains("SUPER_ADMIN"))
        {
            // SUPER_ADMIN có thể duyệt tất cả
            allowedOrgs = null;
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            // ORGANIZATION_ADMIN chỉ có thể duyệt trong tổ chức của mình
            allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(reviewer.OrganizationId, cancellationToken);
        }
        else
        {
            throw new UnauthorizedAccessException("Người dùng không có quyền duyệt điểm danh.");
        }

        var newStatus = request.Status?.Trim().ToUpperInvariant();

        if (newStatus is not ("APPROVED" or "REJECTED"))
            throw new InvalidOperationException("Trạng thái không hợp lệ. Chỉ chấp nhận 'APPROVED' hoặc 'REJECTED'.");

        var attendance = await context.Attendances
            .Include(a => a.AttendanceSession)
            .Include(a => a.ActivityRegistration)
                .ThenInclude(ar => ar.Activity)
                .ThenInclude(a => a.Campaign)
            .FirstOrDefaultAsync(a => a.Id == request.AttendanceId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy bản ghi điểm danh.");

        if (allowedOrgs != null && !allowedOrgs.Contains(attendance.ActivityRegistration.Activity.Campaign.OrganizationId))
            throw new UnauthorizedAccessException("");

        var now = DateTimeOffset.UtcNow;
        attendance.Status = newStatus;
        attendance.ReviewedBy = reviewerId;
        attendance.ReviewedAt = now;

        if (!string.IsNullOrWhiteSpace(request.Note))
            attendance.Note = request.Note;

        var registration = attendance.ActivityRegistration;
        var activity = registration.Activity;

        if (newStatus == "APPROVED")
        {
            var ortherAttendancesTypes = await context.Attendances
                .AsNoTracking()
                .Where(a => a.ActivityRegistrationId == registration.Id 
                        && a.Id != attendance.Id 
                        && a.Status == "APPROVED")
                .Select(a => a.AttendanceSession.Type)
                .ToListAsync(cancellationToken);

            ortherAttendancesTypes.Add(attendance.AttendanceSession.Type);

            var hasCheckIn = ortherAttendancesTypes.Any(t => string.Equals(t, "CHECK_IN", StringComparison.OrdinalIgnoreCase));
            var hasCheckOut = ortherAttendancesTypes.Any(t => string.Equals(t, "CHECK_OUT", StringComparison.OrdinalIgnoreCase));

            if (hasCheckIn && hasCheckOut && activity.CreditDays > 0m)
            {
                // Ghi nhận CreditEarned vào bản ghi điểm danh này
                attendance.CreditEarned = activity.CreditDays;

                // Kiểm tra trong Sổ cái xem đơn đăng ký này đã được cấp ngày công OFFICIAL chưa (tránh cấp trùng)
                var alreadyCredited = await context.VolunteerCreditRecords
                    .AnyAsync(c => c.ActivityRegistrationId == registration.Id
                                && c.Status == VolunteerCreditRecord.StatusOfficial, cancellationToken);

                if (!alreadyCredited)
                {
                    var creditRecord = VolunteerCreditRecord.CreateForActivityCompletion(
                        volunteerId: registration.VolunteerId,
                        activityId: activity.Id,
                        registrationId: registration.Id,
                        creditDays: activity.CreditDays,
                        awardedAt: now,
                        activityName: activity.Name
                    );
                    context.VolunteerCreditRecords.Add(creditRecord);
                }
            }

        }
        else if (newStatus == "REJECTED")
        {
            attendance.CreditEarned = 0m;

            // Nếu trước đó đơn này đã lỡ được cấp ngày công OFFICIAL (VD: Admin đổi ý từ APPROVED -> REJECTED)
            // thì phải thu hồi lại bút toán ngày công đó
            var existingCredits = await context.VolunteerCreditRecords
                .Where(c => c.ActivityRegistrationId == registration.Id
                         && c.Status == VolunteerCreditRecord.StatusOfficial)
                .ToListAsync(cancellationToken);

            foreach (var credit in existingCredits)
            {
                credit.Revoke(
                    string.IsNullOrWhiteSpace(request.Note)
                        ? "Thu hồi ngày công do từ chối điểm danh nghi vấn"
                        : $"Thu hồi ngày công: {request.Note.Trim()}"
                );
            }
        }

        await context.SaveChangesAsync(cancellationToken);

        return true;
    }
}
