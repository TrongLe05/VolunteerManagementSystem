using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardPendingApprovals;
using VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardSchedule;
using VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardSummary;
using VolunteerManagerment.Application.Features.Dashboard.Queries.GetDashboardTrends;

namespace VolunteerManagerment.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
    public class DashboardController(ISender sender) : ControllerBase
    {
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var result = await sender.Send(new GetDashboardSummaryQuery());
            return Ok(result);
        }

        [HttpGet("trends")]
        public async Task<IActionResult> GetTrends(
            [FromQuery] int months = 6,
            CancellationToken cancellationToken = default)
        {
            var result = await sender.Send(new GetDashboardTrendsQuery(months), cancellationToken);
            return Ok(result);
        }

        [HttpGet("pending-approvals")]
        public async Task<IActionResult> GetPendingApprovals(
            [FromQuery] int limit = 5,
            CancellationToken cancellationToken = default)
        {
            var result = await sender.Send(new GetDashboardPendingApprovalsQuery(limit), cancellationToken);
            return Ok(result);
        }

        [HttpGet("schedule")]
        public async Task<IActionResult> GetSchedule(
            [FromQuery] DateOnly? date = null,
            CancellationToken cancellationToken = default)
        {
            var result = await sender.Send(new GetDashboardScheduleQuery(date), cancellationToken);
            return Ok(result);
        }

    }
}
