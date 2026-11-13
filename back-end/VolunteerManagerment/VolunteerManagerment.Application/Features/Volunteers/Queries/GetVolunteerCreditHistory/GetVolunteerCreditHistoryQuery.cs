using MediatR;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetVolunteerCreditHistory;

public record GetVolunteerCreditHistoryQuery(Guid VolunteerId) : IRequest<VolunteerCreditSummaryDto>;
