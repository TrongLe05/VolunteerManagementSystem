using MediatR;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetVolunteerByIdQuery;

public record GetVolunteerByIdQuery(Guid Id) : IRequest<VolunteerDto>;
