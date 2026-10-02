using MediatR;
using VolunteerManagerment.Application.Features.Auth.DTOs;

namespace VolunteerManagerment.Application.Features.Auth.Query.GetMe;

public record GetMeQuery : IRequest<GetMeResponseDto>;
