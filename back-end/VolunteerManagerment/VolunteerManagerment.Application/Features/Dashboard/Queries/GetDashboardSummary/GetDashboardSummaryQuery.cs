using MediatR;
using VolunteerManagerment.Application.Features.Dashboard.DTOs;

namespace VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardSummary;

public record GetDashboardSummaryQuery : IRequest<DashboardSummaryDto>;
