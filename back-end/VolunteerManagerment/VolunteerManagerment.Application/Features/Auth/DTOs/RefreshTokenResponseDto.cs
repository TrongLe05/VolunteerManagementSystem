namespace VolunteerManagerment.Application.Features.Auth.DTOs;

public record RefreshTokenResponseDto(
    string AccessToken,
    string RefreshToken,
    string TokenType,
    int ExpiresIn
);
