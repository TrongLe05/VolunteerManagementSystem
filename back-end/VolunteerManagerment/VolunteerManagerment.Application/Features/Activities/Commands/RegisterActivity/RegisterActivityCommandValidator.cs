using FluentValidation;

namespace VolunteerManagerment.Application.Features.Activities.Commands.RegisterActivity;

public class RegisterActivityCommandValidator : AbstractValidator<RegisterActivityCommand>
{
    public RegisterActivityCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Id hoạt động không được trống.");
    }
}
