using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerManagerment.Application.Features.AuditLogs.Queries.GetAuditLogs;

namespace VolunteerManagerment.API.Controllers;

[Route("api/audit-logs")]
[ApiController]
[Authorize(Roles = "SUPER_ADMIN")]
public class AuditLogsController(ISender sender) : ControllerBase
{
    /// <summary>
    /// Tra cứu danh sách lịch sử thao tác hệ thống (Audit Trail)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAuditLogs([FromQuery] GetAuditLogsQuery query, CancellationToken cancellationToken)
    {
        var result = await sender.Send(query, cancellationToken);
        return Ok(result);
    }
}
