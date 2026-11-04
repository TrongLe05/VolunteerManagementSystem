using FluentValidation;

namespace VolunteerManagerment.Application.Features.Volunteers.Commands.UpdateMyProfile;

public class UpdateMyProfileCommandValidator : AbstractValidator<UpdateMyProfileCommand>
{
    public UpdateMyProfileCommandValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Không được để trống họ và tên.")
            .MaximumLength(255).WithMessage("Họ và tên không được vượt quá 255 ký tự.");

        RuleFor(x => x.Phone)
            .Matches(@"^\+?\d{10,11}$").When(x => !string.IsNullOrEmpty(x.Phone))
            .WithMessage("Số điện thoại phải hợp lệ từ 10 đến 11 chữ số.");

        RuleFor(x => x.Gender)
            .Must(gender => gender == null || gender == "MALE" || gender == "FEMALE" || gender == "OTHER")
            .WithMessage("Giới tính phải là 'Nam', 'Nữ', hoặc 'Khác' nếu được cung cấp.");

        RuleFor(x => x.DateOfBirth)
            .LessThan(DateOnly.FromDateTime(DateTime.Now)).When(x => x.DateOfBirth.HasValue)
            .WithMessage("Ngày sinh phải là ngày trong quá khứ.");

        RuleFor(x => x.ClassName)
            .MaximumLength(50).When(x => !string.IsNullOrEmpty(x.ClassName))
            .WithMessage("Tên lớp không được vượt quá 50 ký tự.");

        RuleFor(x => x.StudentCode)
            .MaximumLength(50).When(x => !string.IsNullOrEmpty(x.StudentCode))
            .WithMessage("Mã số sinh viên không được vượt quá 50 ký tự.");
    }
}
