using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetMyActivityRegistrations;

public class GetMyActivityRegistrationsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IVolunteerRepository volunteerRepository
) : IRequestHandler<GetMyActivityRegistrationsQuery, PageResult<MyActivityRegistrationDto>>
{
    public async Task<PageResult<MyActivityRegistrationDto>> Handle(GetMyActivityRegistrationsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var volunteer = await volunteerRepository.GetByUserIdAsync(userId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ tình nguyện viên.");

        var query = context.ActivityRegistrations
            .AsNoTracking()
            .Where(r => r.VolunteerId == volunteer.Id);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(r => r.Status == request.Status);

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(r => r.RegisteredAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new MyActivityRegistrationDto(
                r.Id,
                r.ActivityId,
                r.Activity.Name,
                r.Activity.Campaign.Name,
                r.Activity.Campaign.Organization.Name,
                r.Activity.StartTime,
                r.Activity.EndTime,
                r.Activity.CreditDays,
                r.Activity.CreditHours,
                r.Activity.Status,
                r.Status,
                r.RegisteredAt,
                r.ApprovedAt
            ))
            .ToListAsync(cancellationToken);

        return new PageResult<MyActivityRegistrationDto>(items, totalCount, request.PageNumber, request.PageSize);
    }
}
