using MediatR;
using VolunteerManagerment.Application.Features.Attendances.DTOs;

namespace VolunteerManagerment.Application.Features.Attendances.Queries.GetActivityAttendanceOverview;

public record GetActivityAttendanceOverviewQuery(Guid ActivityId) : IRequest<ActivityAttendanceOverviewDto>;
