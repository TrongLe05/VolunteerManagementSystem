using MediatR;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetActivityById;

public record GetActivityByIdQuery(Guid Id) : IRequest<ActivityDto>;
