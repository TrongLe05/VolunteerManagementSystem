using FluentValidation;

namespace VolunteerManagerment.Application.Features.Users.Commands.CreateUser;

public class CreateUserCommandValidator : AbstractValidator<CreateUserCommand>
{
    public CreateUserCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Tên đăng nhập không được để trống.")
            .MinimumLength(3).WithMessage("Tên đăng nhập phải có ít nhất 3 ký tự.")
            .MaximumLength(50).WithMessage("Tên đăng nhập không vượt quá 50 ký tự.")
            .Matches(@"^[a-zA-Z0-9_\.]+$").WithMessage("Tên đăng nhập chỉ chứa chữ cái, số, dấu gạch dưới và dấu chấm.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Địa chỉ email không hợp lệ.")
            .MaximumLength(100).WithMessage("Email không vượt quá 100 ký tự.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(6).WithMessage("Mật khẩu phải có ít nhất 6 ký tự.");

        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Đơn vị tổ chức không được để trống.");

        RuleFor(x => x.RoleCodes)
            .NotEmpty().WithMessage("Cần gán ít nhất 1 vai trò cho tài khoản.");
    }
}
