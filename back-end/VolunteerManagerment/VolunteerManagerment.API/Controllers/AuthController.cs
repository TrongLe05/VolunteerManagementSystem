using MediatR;
using Microsoft.AspNetCore.Mvc;
using VolunteerManagerment.Application.Features.Auth.Commands.Login;
using VolunteerManagerment.Application.Features.Auth.Commands.Register;

namespace VolunteerManagerment.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(ISender sender) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginCommand command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterCommands command, CancellationToken cancellationToken)
    {
        var result = await sender.Send(command, cancellationToken);
        return Ok(result);
    }
}
