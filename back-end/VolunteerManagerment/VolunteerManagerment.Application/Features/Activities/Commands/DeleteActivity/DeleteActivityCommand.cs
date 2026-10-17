using MediatR;

namespace VolunteerManagerment.Application.Features.Activities.Commands.DeleteActivity;

public record DeleteActivityCommand(Guid Id) : IRequest<bool>;
