using MediatR;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Commands.GrantManualCredit;

public record GrantManualCreditCommand(
    Guid VolunteerId,
    decimal CreditDays,
    string RecordType,
    string Reason,
    Guid? ActivityId = null
) : IRequest<VolunteerCreditRecordDto>;
