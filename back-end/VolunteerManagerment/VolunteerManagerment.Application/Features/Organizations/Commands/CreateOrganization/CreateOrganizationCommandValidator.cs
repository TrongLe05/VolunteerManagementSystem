using FluentValidation;

namespace VolunteerManagerment.Application.Features.Organizations.Commands.CreateOrganization;

public class CreateOrganizationCommandValidator : AbstractValidator<CreateOrganizationCommand>
{
    public CreateOrganizationCommandValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã tổ chức không được để trống.")
            .MaximumLength(50).WithMessage("Mã tổ chức không thể vượt quá 50 ký tự.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên tổ chức không được để trống.")
            .MaximumLength(100).WithMessage("Tên tổ chức không thể vượt quá 100 ký tự.");
    }
}
