using MediatR;
using VolunteerManagerment.Application.Features.Dashboard.DTOs;

namespace VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardPendingApprovals;

public record GetDashboardPendingApprovalsQuery(int Limit = 5) : IRequest<List<DashboardPendingActivityDto>>;
