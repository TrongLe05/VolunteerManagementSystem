using MediatR;

namespace VolunteerManagerment.Application.Features.Activities.Commands.RegisterActivity;

public record RegisterActivityCommand(Guid Id) : IRequest<Guid>;
