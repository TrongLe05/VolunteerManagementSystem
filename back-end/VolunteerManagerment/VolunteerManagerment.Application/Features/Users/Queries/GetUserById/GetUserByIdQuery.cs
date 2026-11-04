using MediatR;
using VolunteerManagerment.Application.Features.Users.DTOs;

namespace VolunteerManagerment.Application.Features.Users.Queries.GetUserById;

public record GetUserByIdQuery(Guid Id) : IRequest<UserDto>;
