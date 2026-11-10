using FluentValidation;

namespace VolunteerManagerment.Application.Features.Activities.Commands.CreateActivity;

public class CreateActivityCommandValidator : AbstractValidator<CreateActivityCommand>
{
    public CreateActivityCommandValidator()
    {
        RuleFor(x => x.CampaignId)
            .NotEmpty().WithMessage("Id chiến dịch không được trống.");
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên hoạt động không được trống.");
        RuleFor(x => x.EndTime)
            .GreaterThanOrEqualTo(x => x.StartTime).WithMessage("Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu.");
        RuleFor(x => x.CreditDays)
            .GreaterThanOrEqualTo(0).WithMessage("Số ngày tín chỉ phải lớn hơn hoặc bằng 0.");
        RuleFor(x => x.Capacity)
            .GreaterThanOrEqualTo(0).WithMessage("Số lượng tính nguyện viên phải lớn hơn hoặc bằng 0.");
        RuleForEach(x => x.Locations).ChildRules(locaion =>
        {
            locaion.RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên địa điểm không được trống.");
            locaion.RuleFor(x => x.Latitude)
                .InclusiveBetween(-90, 90).WithMessage("Vĩ độ phải nằm trong khoảng từ -90 đến 90.");
            locaion.RuleFor(x => x.Longitude)
                .InclusiveBetween(-180, 180).WithMessage("Kinh độ phải nằm trong khoảng từ -180 đến 180.");
            locaion.RuleFor(x => x.AllowedRadiusMeters)
                .GreaterThan(0).WithMessage("Bán kính cho phép phải lớn hơn 0.");
        });
    }
}
