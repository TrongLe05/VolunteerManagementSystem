namespace VolunteerManagerment.Application.Features.Auth.DTOs;

public record LoginResponseDto(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn,
    UserInfo User
);

public record UserInfo(
    Guid Id,
    string Username,
    string Email,
    string OrganizationName,
    List<string> Roles
);
