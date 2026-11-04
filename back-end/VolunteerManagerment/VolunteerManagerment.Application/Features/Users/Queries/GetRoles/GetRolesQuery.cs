using MediatR;
using VolunteerManagerment.Application.Features.Users.DTOs;

namespace VolunteerManagerment.Application.Features.Users.Queries.GetRoles;

public record GetRolesQuery : IRequest<List<RoleDto>>;
