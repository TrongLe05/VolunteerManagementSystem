using FluentValidation;

namespace VolunteerManagerment.Application.Features.Campaigns.Commands.UpdateCampaign;

public class UpdateCampaignCommandValidator : AbstractValidator<UpdateCampaignCommand>
{
    public UpdateCampaignCommandValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty().WithMessage("Mã chiến dịch không được rỗng.");
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên chiến dịch không được rỗng.")
            .MaximumLength(255).WithMessage("Tên chiến dịch không được vượt quá 255 ký tự.");
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate).WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        RuleFor(x => x.Status)
            .NotEmpty().WithMessage("Trạng thái chiến dịch không được rỗng.")
            .Must(status => status == "DRAFT" || status == "PUBLISHED" || status == "COMPLETED" || status == "CANCELLED").WithMessage("Trạng thái chiến dịch phải là \"DRAFT\", \"PUBLISHED\", \"COMPLETED\" hoặc \"CANCELLED\".");
    }
}
