using FluentValidation;

namespace VolunteerManagerment.Application.Features.Volunteers.Commands.ImportVolunteersFromExcel;

public class ImportVolunteersFromExcelCommandValidator : AbstractValidator<ImportVolunteersFromExcelCommand>
{
    public ImportVolunteersFromExcelCommandValidator()
    {
        RuleFor(x => x.FileStream)
            .NotNull().WithMessage("File không được để trống.")
            .Must(stream => stream != null && stream.Length > 0).WithMessage("File không được để trống.");
        RuleFor(x => x.FileName)
            .NotEmpty().WithMessage("Tên file không được để trống.")
            .Must(fileName => 
                fileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase) || 
                fileName.EndsWith(".xls", StringComparison.OrdinalIgnoreCase))
            .WithMessage("Định dạng file không hợp lệ. Chỉ chấp nhận file Excel (.xlsx, .xls).");
    }
}
