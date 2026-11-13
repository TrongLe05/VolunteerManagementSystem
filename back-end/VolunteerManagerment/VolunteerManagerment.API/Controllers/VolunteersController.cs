using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerManagerment.Application.Features.Volunteers.Commands.GrantManualCredit;
using VolunteerManagerment.Application.Features.Volunteers.Commands.ImportVolunteersFromExcel;
using VolunteerManagerment.Application.Features.Volunteers.Commands.UpdateMyProfile;
using VolunteerManagerment.Application.Features.Volunteers.Queries.GetMyCreditHistory;
using VolunteerManagerment.Application.Features.Volunteers.Queries.GetMyProfile;
using VolunteerManagerment.Application.Features.Volunteers.Queries.GetVolunteerByIdQuery;
using VolunteerManagerment.Application.Features.Volunteers.Queries.GetVolunteerCreditHistory;
using VolunteerManagerment.Application.Features.Volunteers.Queries.GetVolunteers;

namespace VolunteerManagerment.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VolunteersController(ISender sender) : ControllerBase
    {
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile(CancellationToken cancellationToken)
        {
            var result = await sender.Send(new GetMyProfileQuery(), cancellationToken);
            return Ok(result);
        }

        [HttpGet("me/credits")]
        public async Task<IActionResult> GetMyCredits(CancellationToken cancellationToken)
        {
            var result = await sender.Send(new GetMyCreditHistoryQuery(), cancellationToken);
            return Ok(result);
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileCommand command, CancellationToken cancellationToken)
        {
            var result = await sender.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> GetVolunteers([FromQuery] GetVolunteersQuery query, CancellationToken cancellationToken)
        {
            var result = await sender.Send(query, cancellationToken);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> GetVolunteerById([FromRoute] Guid id, CancellationToken cancellationToken)
        {
            var result = await sender.Send(new GetVolunteerByIdQuery(id), cancellationToken);
            return Ok(result);
        }

        [HttpGet("{id}/credits")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> GetVolunteerCredits([FromRoute] Guid id, CancellationToken cancellationToken)
        {
            var result = await sender.Send(new GetVolunteerCreditHistoryQuery(id), cancellationToken);
            return Ok(result);
        }

        [HttpPost("{id}/credits/manual-grant")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> GrantManualCredit([FromRoute] Guid id, [FromBody] GrantManualCreditCommand command, CancellationToken cancellationToken)
        {
            if (id != command.VolunteerId)
            {
                command = command with { VolunteerId = id };
            }
            var result = await sender.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpPost("import")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> ImportVolunteersFromExcel(IFormFile file, [FromForm] Guid organizationId, CancellationToken cancellationToken)
        {
            
            using var stream = file.OpenReadStream();
            var result = await sender.Send(new ImportVolunteersFromExcelCommand(stream, file?.FileName ?? string.Empty, organizationId), cancellationToken);
            return Ok(result);
        }
    }
}
