using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerManagerment.Application.Features.Activities.Commands.CreateActivity;
using VolunteerManagerment.Application.Features.Activities.Commands.DeleteActivity;
using VolunteerManagerment.Application.Features.Activities.Commands.UpdateActivity;
using VolunteerManagerment.Application.Features.Activities.Queries.GetActivities;
using VolunteerManagerment.Application.Features.Activities.Queries.GetActivityById;

namespace VolunteerManagerment.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ActivitiesController(ISender sender) : ControllerBase
    {
        [HttpPost]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> CreateActivity([FromBody] CreateActivityCommand command, CancellationToken cancellationToken)
        {
            var activityId = await sender.Send(command, cancellationToken);
            return CreatedAtAction(nameof(GetActivityById), new { id = activityId }, activityId);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN,VOLUNTEER")]
        public async Task<IActionResult> GetActivityById([FromRoute] Guid id, CancellationToken cancellationToken)
        {
            var activity = await sender.Send(new GetActivityByIdQuery(id), cancellationToken);
            return Ok(activity);
        }

        [HttpGet]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN,VOLUNTEER")]
        public async Task<IActionResult> GetActivities([FromQuery] GetActivitiesQuery query, CancellationToken cancellationToken)
        {
            var activities = await sender.Send(query, cancellationToken);
            return Ok(activities);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> UpdateActivity([FromRoute] Guid id, [FromBody] UpdateActivityCommand command, CancellationToken cancellationToken)
        {
            if (id != command.Id)
                return BadRequest("Id ở đường dẫn không khớp với Id ở body.");
            var result = await sender.Send(command, cancellationToken);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> DeleteActivity([FromRoute] Guid id, CancellationToken cancellationToken)
        {
            var result = await sender.Send(new DeleteActivityCommand(id), cancellationToken);
            return Ok(result);
        }
    }
}
