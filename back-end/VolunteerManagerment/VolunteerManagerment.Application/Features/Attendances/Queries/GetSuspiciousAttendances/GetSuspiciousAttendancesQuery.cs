using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries.GetSuspiciousAttendances;

public record GetSuspiciousAttendancesQuery(
    string? Status = "PENDING",
    string? SearchTerm = null,
    Guid? ActivityId = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PageResult<SuspiciousAttendanceDto>>;