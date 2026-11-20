using MediatR;
using VolunteerManagerment.Application.Features.Dashboard.DTOsl;

namespace VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardTrends;

public record GetDashboardTrendsQuery(int Months = 6) : IRequest<DashboardTrendsDto>;
