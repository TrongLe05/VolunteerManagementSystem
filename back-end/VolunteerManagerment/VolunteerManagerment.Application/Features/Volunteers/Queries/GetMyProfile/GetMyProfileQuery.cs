using MediatR;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetMyProfile;

public record GetMyProfileQuery : IRequest<VolunteerDto>;
