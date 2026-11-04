using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries.GetSessionAttendances;

public class GetSessionAttendancesQueryHandler(
    IApplicationDbContext context
) : IRequestHandler<GetSessionAttendancesQuery, List<AttendanceRecordDto>>
{
    public async Task<List<AttendanceRecordDto>> Handle(GetSessionAttendancesQuery request, CancellationToken cancellationToken)
    {
        return await context.Attendances
            .Include(a => a.ActivityRegistration)
                .ThenInclude(ar => ar.Volunteer)
            .Where(a => a.AttendanceSessionId == request.SessionId)
            .OrderByDescending(a => a.AttendedAt)
            .Select(a => new AttendanceRecordDto(
                a.Id,
                a.ActivityRegistration.VolunteerId,
                a.ActivityRegistration.Volunteer.FullName,
                a.ActivityRegistration.Volunteer.StudentCode,
                a.ActivityRegistration.Volunteer.ClassName,
                a.AttendedAt,
                a.Latitude,
                a.Longitude,
                a.LocationAccuracyMeters,
                a.LocationStatus,
                a.VerificationMethod,
                a.FaceSimilarity,
                a.IsLivenessVerified,
                a.CapturedImageUrl,
                a.Status,
                a.Note
            ))
            .ToListAsync(cancellationToken);
    }
}
