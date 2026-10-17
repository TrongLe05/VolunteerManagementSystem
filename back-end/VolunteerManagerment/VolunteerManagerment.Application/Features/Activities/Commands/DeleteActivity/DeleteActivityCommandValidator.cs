using FluentValidation;

namespace VolunteerManagerment.Application.Features.Activities.Commands.DeleteActivity;

public class DeleteActivityCommandValidator : AbstractValidator<DeleteActivityCommand>
{
    public DeleteActivityCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id hoạt động không được để trống.");
    }
}
