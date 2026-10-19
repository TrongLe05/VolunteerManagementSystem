using FluentValidation;

namespace VolunteerManagerment.Application.Features.Activities.Commands.ReviewActivityRegistration;

public class ReviewActivityRegistrationValidator : AbstractValidator<ReviewActivityRegistrationCommand>
{
    public ReviewActivityRegistrationValidator()
    {
        RuleFor(x => x.ActivityId)
            .NotEmpty().WithMessage("Id hoạt động không được để trống.");
        RuleFor(x => x.RegistrationId)
            .NotEmpty().WithMessage("Id đơn đăng ký không được để trống.");
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái không được để trống.")
            .Must(status => status == "APPROVED" || status == "REJECTED")
            .WithMessage("Trạng thái phải là APPROVED hoặc REJECTED.");
    }
}
