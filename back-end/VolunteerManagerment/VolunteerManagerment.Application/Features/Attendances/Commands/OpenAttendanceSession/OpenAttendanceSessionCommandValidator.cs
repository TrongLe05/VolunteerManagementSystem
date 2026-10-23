using FluentValidation;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.OpenAttendanceSession;

public class OpenAttendanceSessionCommandValidator : AbstractValidator<OpenAttendanceSessionCommand>
{
    public OpenAttendanceSessionCommandValidator()
    {
        RuleFor(x => x.ActivityId)
            .NotEmpty().WithMessage("Id hoạt động không đượcbỏ trống.");
        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("Loại điểm danh không được bỏ trống.")
            .Must(type => type == "CHECK_IN" || type == "CHECK_OUT")
            .WithMessage("Loại điểm danh phải là 'CHECK_IN' hoặc 'CHECK_OUT'.");
        RuleFor(x => x.DurationMinutes)
            .GreaterThan(0).When(x => x.DurationMinutes.HasValue)
            .WithMessage("Thời lượng điểm danh phải lớn hơn 0 nếu được cung cấp.");
    }
}
