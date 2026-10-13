using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerManagerment.Application.Features.Campaigns.Commands.CreateCampaign;
using VolunteerManagerment.Application.Features.Campaigns.Commands.DeleteCampaign;
using VolunteerManagerment.Application.Features.Campaigns.Commands.UpdateCampaign;
using VolunteerManagerment.Application.Features.Campaigns.Queries.GetCampaignById;
using VolunteerManagerment.Application.Features.Campaigns.Queries.GetCampaigns;

namespace VolunteerManagerment.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class CampaignsController(ISender sender) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = "SUPER_ADMIN, ORGANIZATION_ADMIN")]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignCommand command, CancellationToken cancellationToken)
    {
        var campaignId = await sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetCampaignById), new { id = campaignId }, campaignId);
    }

    [HttpGet]
    public async Task<IActionResult> GetCampaigns([FromQuery] GetCampaignsQuery query, CancellationToken cancellationToken)
    {
        var result = await sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "SUPER_ADMIN, ORGANIZATION_ADMIN, VOLUNTEER")]
    public async Task<IActionResult> GetCampaignById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCampaignByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SUPER_ADMIN, ORGANIZATION_ADMIN")]
    public async Task<IActionResult> UpdateCampaign([FromRoute] Guid id, [FromBody] UpdateCampaignCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("Mã chiến dịch trong đường dẫn không khớp với mã chiến dịch trong nội dung yêu cầu.");

        var result = await sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SUPER_ADMIN, ORGANIZATION_ADMIN")]
    public async Task<IActionResult> DeleteCampaign([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteCampaignCommand(id), cancellationToken);
        return Ok(result);
    }
}
