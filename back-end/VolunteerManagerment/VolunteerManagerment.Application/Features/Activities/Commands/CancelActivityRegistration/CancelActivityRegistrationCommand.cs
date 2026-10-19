using MediatR;

namespace VolunteerManagerment.Application.Features.Activities.Commands.CancelActivityRegistration;

public record CancelActivityRegistrationCommand(Guid ActivityId) : IRequest<bool>;
