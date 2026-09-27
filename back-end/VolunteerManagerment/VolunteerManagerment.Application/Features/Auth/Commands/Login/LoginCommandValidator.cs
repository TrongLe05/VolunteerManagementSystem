using FluentValidation;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Login;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(u => u.UsernameOrEmail)
            .NotEmpty().WithMessage("Tên đăng nhập hoặc email không được để trống!");

        RuleFor(u => u.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống!")
            .MinimumLength(6).WithMessage("Mật khẩu phải có ít nhất 6 ký tự!");
    }
}
