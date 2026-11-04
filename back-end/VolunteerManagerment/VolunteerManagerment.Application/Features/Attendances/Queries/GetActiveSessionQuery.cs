using MediatR;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries;

public record GetActiveSessionQuery(Guid ActivityId) : IRequest<ActiveAttendanceSessionDto?>;
