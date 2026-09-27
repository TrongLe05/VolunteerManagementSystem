using FluentValidation;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Register;

public class RegisterCommandValidator : AbstractValidator<RegisterCommands>
{
    public RegisterCommandValidator()
    {
        RuleFor(u => u.Username)
            .NotEmpty().WithMessage("Tên đăng nhập không được để trống!")
            .MinimumLength(3).WithMessage("Tên đăng nhập phải có ít nhất 3 ký tự!");

        RuleFor(u => u.Email)
            .NotEmpty().WithMessage("Email không được để trống!")
            .EmailAddress().WithMessage("Email không hợp lệ!");

        RuleFor(u => u.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống!")
            .MinimumLength(6).WithMessage("Mật khẩu phải có ít nhất 6 ký tự!");

        //RuleFor(u => u.Name)
        //    .NotEmpty().WithMessage("Tên không được để trống!");
    }
}
