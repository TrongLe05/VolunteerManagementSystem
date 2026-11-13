using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetMyCreditHistory;

public class GetMyCreditHistoryQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IVolunteerRepository volunteerRepository
) : IRequestHandler<GetMyCreditHistoryQuery, VolunteerCreditSummaryDto>
{
    public async Task<VolunteerCreditSummaryDto> Handle(GetMyCreditHistoryQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var volunteer = await volunteerRepository.GetByUserIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ tình nguyện viên cho người dùng này.");

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
