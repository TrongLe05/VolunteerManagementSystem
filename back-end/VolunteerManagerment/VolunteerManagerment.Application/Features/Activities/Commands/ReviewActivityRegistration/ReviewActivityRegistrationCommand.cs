using MediatR;

namespace VolunteerManagerment.Application.Features.Activities.Commands.ReviewActivityRegistration;

public record ReviewActivityRegistrationCommand(
    Guid ActivityId,
    Guid RegistrationId,
    string Status
) : IRequest<bool>;
