using FluentValidation;

namespace VolunteerManagerment.Application.Features.Auth.Commands.VerifyOtp;

public class VerifyOtpCommandValidator : AbstractValidator<VerifyOtpCommand>
{
    public VerifyOtpCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống!")
            .EmailAddress().WithMessage("Email không hợp lệ!");

        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("Mã OTP không được để trống!")
            .Length(6).WithMessage("Mã OTP phải gồm đúng 6 chữ số!");
    }
}
