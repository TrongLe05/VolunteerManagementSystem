using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerManagerment.Application.Features.Organizations.Commands.CreateOrganization;
using VolunteerManagerment.Application.Features.Organizations.Commands.DeleteOrganization;
using VolunteerManagerment.Application.Features.Organizations.Commands.UpdateOrganization;
using VolunteerManagerment.Application.Features.Organizations.Queries.GetOrganizations;

namespace VolunteerManagerment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrganizationsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetOrganizations([FromQuery] string? searchTerm, CancellationToken cancellationToken)
    {
        var organizations = await sender.Send(new GetOrganizationsQuery(searchTerm), cancellationToken);
        return Ok(organizations);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateOrganization([FromBody] CreateOrganizationCommand command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateOrganization([FromRoute] Guid id, [FromBody] UpdateOrganizationCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id)
            return BadRequest("ID in the route does not match ID in the request body.");

        var result = await sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteOrganization([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DeleteOrganizationCommand(id), cancellationToken);
        return Ok(result);
    }
}
