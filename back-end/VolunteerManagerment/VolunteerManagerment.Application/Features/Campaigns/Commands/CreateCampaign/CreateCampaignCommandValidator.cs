using FluentValidation;

namespace VolunteerManagerment.Application.Features.Campaigns.Commands.CreateCampaign;

public class CreateCampaignCommandValidator : AbstractValidator<CreateCampaignCommand>
{
    public CreateCampaignCommandValidator()
    {
        RuleFor(x => x.OrganizationId)
            .NotEmpty().WithMessage("Không được để trống mã tổ chức.");
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Không được để trống tên chiến dịch.")
            .MaximumLength(255).WithMessage("Tên chiến dịch không vượt quá 255 ký tự.");
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Mô tả không được vượt quá 500 ký tự.");
        RuleFor(x => x.EndDate)
            .GreaterThanOrEqualTo(x => x.StartDate).WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
    }
}
