using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerManagerment.Application.Features.Users.Commands.AdminResetPassword;
using VolunteerManagerment.Application.Features.Users.Commands.CreateUser;
using VolunteerManagerment.Application.Features.Users.Commands.ToggleUserStatus;
using VolunteerManagerment.Application.Features.Users.Commands.UpdateUser;
using VolunteerManagerment.Application.Features.Users.Queries.GetRoles;
using VolunteerManagerment.Application.Features.Users.Queries.GetUserById;
using VolunteerManagerment.Application.Features.Users.Queries.GetUsers;

namespace VolunteerManagerment.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
public class UsersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] GetUsersQuery query, CancellationToken cancellationToken)
    {
        var result = await sender.Send(query, cancellationToken);
        return Ok(result);
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetRolesQuery(), cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUserById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetUserByIdQuery(id), cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserCommand command, CancellationToken cancellationToken)
    {
        var id = await sender.Send(command, cancellationToken);
        return CreatedAtAction(nameof(GetUserById), new { id }, new { id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser([FromRoute] Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var command = new UpdateUserCommand(
            id,
            request.Email,
            request.OrganizationId,
            request.RoleCodes,
            request.IsActive,
            request.FullName,
            request.StudentCode,
            request.Phone
        );
        var result = await sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> ToggleUserStatus([FromRoute] Guid id, [FromBody] ToggleUserStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ToggleUserStatusCommand(id, request.IsActive), cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id}/reset-password")]
    public async Task<IActionResult> AdminResetPassword([FromRoute] Guid id, [FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new AdminResetPasswordCommand(id, request.NewPassword), cancellationToken);
        return Ok(result);
    }
}

public record UpdateUserRequest(
    string Email,
    Guid OrganizationId,
    List<string> RoleCodes,
    bool IsActive,
    string? FullName = null,
    string? StudentCode = null,
    string? Phone = null
);

public record ToggleUserStatusRequest(
    bool IsActive
);

public record ResetPasswordRequest(
    string NewPassword
);
