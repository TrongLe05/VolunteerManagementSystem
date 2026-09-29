using MediatR;
using VolunteerManagerment.Application.Features.Auth.DTOs;

namespace VolunteerManagerment.Application.Features.Auth.Commands.RefreshTokens;

public record RefreshTokenCommand(string ExpiredAccessToken, string RefreshToken) : IRequest<RefreshTokenResponseDto>;
