using FluentValidation;

namespace VolunteerManagerment.Application.Features.Activities.Commands.CancelActivityRegistration;

public class CancelActivityRegistrationValidator : AbstractValidator<CancelActivityRegistrationCommand>
{
    public CancelActivityRegistrationValidator()
    {
        RuleFor(x => x.ActivityId)
            .NotEmpty().WithMessage("Id hoạt động không được để trống.");
    }
}
