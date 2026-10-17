using FluentValidation;

namespace VolunteerManagerment.Application.Features.Activities.Commands.UpdateActivity;

public class UpdateActivityCommandValidator : AbstractValidator<UpdateActivityCommand>
{
    public UpdateActivityCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Id hoạt động không được để trống.");
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên hoạt động không được để trống.")
            .MaximumLength(255).WithMessage("Tên hoạt động không được vượt quá 255 ký tự.");
        RuleFor(x => x.EndTime)
            .GreaterThan(x => x.StartTime).WithMessage("Thời gian kết thúc phải lớn hơn thời gian bắt đầu.");
        RuleFor(x => x.CreditDays)
            .GreaterThanOrEqualTo(0).WithMessage("Số ngày tín chỉ phải lớn hơn hoặc bằng 0.");
        RuleFor(x => x.CreditHours)
            .GreaterThanOrEqualTo(0).WithMessage("Số giờ tín chỉ phải lớn hơn hoặc bằng 0.");
        RuleFor(x => x.Capacity)
            .GreaterThan(0).WithMessage("Số lượng tình nguyện viên phải lớn hơn 0.");
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái hoạt động không được để trống.")
            .Must(status => status is "DRAFT" or "OPEN" or "ONGOING" or "COMPLETED" or "CANCELLED")
            .WithMessage("Trạng thái hoạt động phải là một trong các giá trị: DRAFT, OPEN, ONGOING, COMPLETED, CANCELLED.");
        RuleForEach(x => x.Locations).ChildRules(l =>
        {
            l.RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên địa điểm không được trống.");
            l.RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90).WithMessage("Vĩ độ phải nằm trong khoảng từ -90 đến 90.");
            l.RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180).WithMessage("Kinh độ phải nằm trong khoảng từ -180 đến 180.");
            l.RuleFor(x => x.AllowedRadiusMeters)
                .GreaterThan(0).WithMessage("Bán kính cho phép phải lớn hơn 0.");
        });
    }
}
