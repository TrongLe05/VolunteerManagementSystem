using MediatR;
using VolunteerManagerment.Application.Features.Dashboard.DTOs;

namespace VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardSchedule;

public record GetDashboardScheduleQuery(DateOnly? Date = null) : IRequest<DashboardScheduleDto>;
