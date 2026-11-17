namespace VolunteerManagerment.Application.Features.Auth.DTOs;

public record GoogleLoginResponseDto(
    bool RequiresOrganization,
    string? Email,
    string? FullName,
    LoginResponseDto? LoginData
);
