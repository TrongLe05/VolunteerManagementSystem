using FluentValidation;

namespace VolunteerManagerment.Application.Features.Users.Commands.UpdateUser;

public class UpdateUserCommandValidator : AbstractValidator<UpdateUserCommand>
{
    public UpdateUserCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("ID tài khoản không được để trống.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Địa chỉ email không hợp lệ.")
            .MaximumLength(100).WithMessage("Email không vượt quá 100 ký tự.");

        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Đơn vị tổ chức không được để trống.");

        RuleFor(x => x.RoleCodes)
            .NotEmpty().WithMessage("Cần gán ít nhất 1 vai trò cho tài khoản.");
    }
}
