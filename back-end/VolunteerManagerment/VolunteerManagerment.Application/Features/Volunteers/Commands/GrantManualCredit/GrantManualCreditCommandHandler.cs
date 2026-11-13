using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Volunteers.Commands.GrantManualCredit;

public class GrantManualCreditCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IVolunteerRepository volunteerRepository,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GrantManualCreditCommand, VolunteerCreditRecordDto>
{
    public async Task<VolunteerCreditRecordDto> Handle(GrantManualCreditCommand request, CancellationToken cancellationToken)
    {
        if (request.CreditDays == 0m)
            throw new ArgumentException("Số ngày công điều chỉnh phải khác 0.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new ArgumentException("Vui lòng nhập lý do cấp hoặc điều chỉnh ngày công.");

        var volunteer = await volunteerRepository.GetByIdAsync(request.VolunteerId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy thông tin tình nguyện viên.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (!roles.Contains("SUPER_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(volunteer.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền điều chỉnh ngày công cho tình nguyện viên thuộc đơn vị này.");
            }
        }

        var now = DateTimeOffset.UtcNow;
        var record = VolunteerCreditRecord.CreateManual(
            volunteerId: volunteer.Id,
            creditDays: request.CreditDays,
            recordType: request.RecordType,
            reason: request.Reason,
            awardedBy: userId,
            awardedAt: now,
            activityId: request.ActivityId
        );

        context.VolunteerCreditRecords.Add(record);
        await context.SaveChangesAsync(cancellationToken);

        string? activityName = null;
        if (request.ActivityId.HasValue)
        {
            var act = await context.Activities.FindAsync([request.ActivityId.Value], cancellationToken);
            activityName = act?.Name;
        }

        return new VolunteerCreditRecordDto(
            record.Id,
            record.ActivityId,
            activityName,
            record.ActivityRegistrationId,
            record.CreditDays,
            record.RecordType,
            record.AwardedAt,
            record.AwardedBy,
            user.Username,
            record.Reason,
            record.Status
        );
    }
}
