using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries;

public class GetActiveSessionQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService
) : IRequestHandler<GetActiveSessionQuery, ActiveAttendanceSessionDto?>
{
    public async Task<ActiveAttendanceSessionDto?> Handle(GetActiveSessionQuery request, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;

        var session = await context.AttendanceSessions
            .Include(s => s.Activity)
            .Where(s => s.ActivityId == request.ActivityId && (s.EndedAt == null || s.EndedAt > now))
            .FirstOrDefaultAsync(cancellationToken);
        
        if (session is null) return null;

        var hasAttended = false;
        var userId = currentUserService.UserId;

        if (userId.HasValue)
        {
            var volunteer = await context.Volunteers.FirstOrDefaultAsync(v => v.UserId == userId.Value, cancellationToken);
            if (volunteer is not null)
            {
                var reg = await context.ActivityRegistrations.FirstOrDefaultAsync(r => r.ActivityId == request.ActivityId && r.VolunteerId == volunteer.Id, cancellationToken);
                if (reg is not null)
                    hasAttended = await context.Attendances.AnyAsync(r => r.AttendanceSessionId == session.Id && r.ActivityRegistrationId == reg.Id, cancellationToken);
            }
        }

        var remainingSeconds = session.EndedAt.HasValue ? Math.Max(0, (int)(session.EndedAt.Value - now).TotalSeconds) : 0;

        return new ActiveAttendanceSessionDto(
            session.Id,
            session.ActivityId,
            session.Activity.Name,
            session.Type,
            session.StartedAt,
            session.EndedAt,
            remainingSeconds,
            hasAttended
        );

    }
}
