namespace VolunteerManagerment.Application.Features.Users.DTOs;

public record RoleDto(
    Guid Id,
    string Name,
    string Code,
    string Description
);
