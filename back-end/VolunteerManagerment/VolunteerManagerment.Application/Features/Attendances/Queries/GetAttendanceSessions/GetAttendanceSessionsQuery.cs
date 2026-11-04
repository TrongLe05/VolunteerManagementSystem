using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries.GetAttendanceSessions;

public record GetAttendanceSessionsQuery(
    Guid? ActivityId = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PageResult<AttendanceSessionItemDto>>;
