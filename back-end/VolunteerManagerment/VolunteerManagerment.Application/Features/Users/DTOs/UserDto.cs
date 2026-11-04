namespace VolunteerManagerment.Application.Features.Users.DTOs;

public record UserDto(
    Guid Id,
    string Username,
    string Email,
    Guid OrganizationId,
    string OrganizationName,
    bool IsActive,
    string? AvatarUrl,
    DateTimeOffset LastLoginAt,
    DateTimeOffset CreatedAt,
    List<string> Roles,
    string? FullName,
    string? StudentCode,
    string? Phone
);
