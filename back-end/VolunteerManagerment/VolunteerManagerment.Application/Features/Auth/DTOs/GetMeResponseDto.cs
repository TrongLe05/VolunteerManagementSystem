namespace VolunteerManagerment.Application.Features.Auth.DTOs;

public record GetMeResponseDto(
    Guid Id,
    string Username,
    string Email,
    Guid OrganizationId,
    string OrganizationName,
    List<string> Roles
);
