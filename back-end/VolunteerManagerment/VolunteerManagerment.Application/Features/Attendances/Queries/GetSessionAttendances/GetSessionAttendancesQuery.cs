using MediatR;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries.GetSessionAttendances;

public record GetSessionAttendancesQuery(Guid SessionId) : IRequest<List<AttendanceRecordDto>>;
