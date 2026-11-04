using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Users.DTOs;

namespace VolunteerManagerment.Application.Features.Users.Queries.GetUsers;

public record GetUsersQuery(
    string? SearchTerm = null,
    Guid? OrganizationId = null,
    string? Role = null,
    bool? IsActive = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<PageResult<UserDto>>;
