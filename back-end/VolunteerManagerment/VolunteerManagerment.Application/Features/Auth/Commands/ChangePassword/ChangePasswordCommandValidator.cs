using FluentValidation;

namespace VolunteerManagerment.Application.Features.Auth.Commands.ChangePassword;

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("Vui lòng nhập mật khẩu hiện tại!");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu mới!")
            .MinimumLength(6).WithMessage("Mật khẩu mới phải có ít nhất 6 ký tự!")
            .NotEqual(x => x.CurrentPassword).WithMessage("Mật khẩu mới không được trùng với mật khẩu cũ!");

        RuleFor(x => x.ConfirmNewPassword)
            .Equal(x => x.NewPassword).WithMessage("Xác nhận mật khẩu mới không khớp!");
    }
}
