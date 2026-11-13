using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetVolunteerCreditHistory;

public class GetVolunteerCreditHistoryQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IVolunteerRepository volunteerRepository,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetVolunteerCreditHistoryQuery, VolunteerCreditSummaryDto>
{
    public async Task<VolunteerCreditSummaryDto> Handle(GetVolunteerCreditHistoryQuery request, CancellationToken cancellationToken)
    {
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
                throw new UnauthorizedAccessException("Bạn không có quyền xem thông tin ngày công của tình nguyện viên thuộc đơn vị này.");
            }
        }

        var records = await context.VolunteerCreditRecords
            .AsNoTracking()
            .Include(r => r.Activity)
            .Include(r => r.Awarder)
            .Where(r => r.VolunteerId == volunteer.Id)
            .OrderByDescending(r => r.AwardedAt)
            .Select(r => new VolunteerCreditRecordDto(
                r.Id,
                r.ActivityId,
                r.Activity != null ? r.Activity.Name : null,
                r.ActivityRegistrationId,
                r.CreditDays,
                r.RecordType,
                r.AwardedAt,
                r.AwardedBy,
                r.Awarder != null ? r.Awarder.Username : null,
                r.Reason,
                r.Status
            ))
            .ToListAsync(cancellationToken);

        var totalDays = records
            .Where(r => r.Status == VolunteerCreditRecord.StatusOfficial)
            .Sum(r => r.CreditDays);

        var officialCount = records
            .Count(r => r.Status == VolunteerCreditRecord.StatusOfficial);

        return new VolunteerCreditSummaryDto(
            volunteer.Id,
            volunteer.FullName,
            volunteer.StudentCode,
            totalDays,
            officialCount,
            records
        );
    }
}
