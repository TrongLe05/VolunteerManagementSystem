using MediatR;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetMyCreditHistory;

public record GetMyCreditHistoryQuery : IRequest<VolunteerCreditSummaryDto>;
