using FluentValidation;

namespace VolunteerManagerment.Application.Features.Organizations.Commands.UpdateOrganization;

public class UpdateOrganizationCommandValidator : AbstractValidator<UpdateOrganizationCommand>
{
    public UpdateOrganizationCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id tổ chức không được để trống.");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Mã tổ chức không được để trống.")
            .MaximumLength(50).WithMessage("Mã tổ chức không được vượt quá 50 ký tự.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên tổ chức không được để trống.")
            .MaximumLength(100).WithMessage("Tên tổ chức không được vượt quá 100 ký tự.");

        RuleFor(x => x.ParentId)
            .NotEqual(x => x.Id).WithMessage("Tổ chức không thể trực thuộc chính nó.");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả tổ chức không được vượt quá 500 ký tự.");
    }
}
