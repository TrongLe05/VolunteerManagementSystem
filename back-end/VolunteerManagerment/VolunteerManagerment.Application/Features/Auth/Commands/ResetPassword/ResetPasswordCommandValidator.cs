using FluentValidation;

namespace VolunteerManagerment.Application.Features.Auth.Commands.ResetPassword;

public class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Không được để trống Email.")
            .EmailAddress().WithMessage("Không đúng định dạng Email.");

        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("Mã OTP không được để trống.")
            .MinimumLength(6).WithMessage("Mã OTP phải có ít nhất 6 ký tự.");

        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Vui lòng nhập mật khẩu mới.")
            .MinimumLength(6).WithMessage("Mật khẩu mới phải có ít nhất 6 ký tự.");

        RuleFor(x => x.ConfirmNewPassword)
            .NotEmpty().WithMessage("Vui lòng xác nhận mật khẩu mới.")
            .Equal(x => x.NewPassword).WithMessage("Xác nhận mật khẩu mới phải khớp với mật khẩu mới.");
    }
}
