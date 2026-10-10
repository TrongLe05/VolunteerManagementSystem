using MediatR;
using System.Globalization;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Volunteers.Commands.ImportVolunteersFromExcel;

public class ImportVolunteersFromExcelCommandHandler(
    IExcelService excelService,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IVolunteerRepository volunteerRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<ImportVolunteersFromExcelCommand, ImportVolunteersResultDto>
{
    public async Task<ImportVolunteersResultDto> Handle(ImportVolunteersFromExcelCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(r => r.Role.Code).ToList();

        if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId);
            if (!allowedOrgs.Contains(request.OrganizationId))
                throw new UnauthorizedAccessException("Bạn không có quyền nhập dữ liệu cho tổ chức này.");
        }
        else if (!roles.Contains("SUPER_ADMIN"))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền nhập dữ liệu.");
        }

        var rows = await excelService.ReadAsync<VolunteerImportRowDto>(request.FileStream, cancellationToken);
        if (rows == null || rows.Count == 0)
        {
            return new ImportVolunteersResultDto(0, 0, 0, new List<string> { "File Excel rỗng hoặc không có dữ liệu." });
        }

        var excelStudentCode = rows
            .Where(r => !string.IsNullOrWhiteSpace(r.StudentCode))
            .Select(r => r.StudentCode!.Trim())
            .Distinct().ToList();

        var exitingCodeInDb = await volunteerRepository.GetExistingStudentCodesAsync(excelStudentCode, cancellationToken);

        var existingCodesSet = exitingCodeInDb.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var seenCodesInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var errors = new List<string>();
        var validVolunteers = new List<Volunteer>();

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            int rowNumber = i + 2; // Dòng 1 là tiêu đề (Header), dữ liệu bắt đầu từ dòng 2

            // 1. Kiểm tra Họ và tên
            if (string.IsNullOrWhiteSpace(row.FullName))
            {
                errors.Add($"Dòng {rowNumber}: Họ và tên không được để trống.");
                continue;
            }

            // 2. Kiểm tra MSSV
            if (string.IsNullOrWhiteSpace(row.StudentCode))
            {
                errors.Add($"Dòng {rowNumber}: MSSV không được để trống.");
                continue;
            }

            var studentCode = row.StudentCode.Trim();

            // 3. Kiểm tra trùng MSSV với Database
            if (existingCodesSet.Contains(studentCode))
            {
                errors.Add($"Dòng {rowNumber}: MSSV '{studentCode}' đã tồn tại trong hệ thống.");
                continue;
            }

            // 4. Kiểm tra trùng MSSV trong chính file Excel
            if (!seenCodesInFile.Add(studentCode))
            {
                errors.Add($"Dòng {rowNumber}: MSSV '{studentCode}' bị trùng lặp trong file Excel.");
                continue;
            }

            // 5. Chuẩn hóa giới tính về chuẩn DB ('MALE' / 'FEMALE' / 'OTHER')
            string? normalizedGender = row.Gender?.Trim().ToUpper() switch
            {
                "NAM" or "MALE" => "MALE",
                "NỮ" or "NU" or "FEMALE" => "FEMALE",
                "KHÁC" or "OTHER" => "OTHER",
                _ => null
            };

            // 6. Parse ngày sinh an toàn (hỗ trợ nhiều định dạng ngày thông dụng)
            DateOnly? parsedDob = null;
            if (!string.IsNullOrWhiteSpace(row.DateOfBirth))
            {
                if (DateOnly.TryParseExact(row.DateOfBirth.Trim(), new[] { "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dob))
                {
                    parsedDob = dob;
                }
            }

            // 7. Tạo Entity Volunteer
            var volunteer = new Volunteer
            {
                Id = Guid.NewGuid(),
                OrganizationId = request.OrganizationId,
                VolunteerCode = $"TNV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
                StudentCode = studentCode,
                FullName = row.FullName.Trim(),
                ClassName = row.ClassName?.Trim(),
                Gender = normalizedGender,
                DateOfBirth = parsedDob,
                Phone = row.Phone?.Trim(),
                JoinedAt = DateOnly.FromDateTime(DateTime.UtcNow),
                IsActive = true,
                ConsentFaceAuth = false,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };

            validVolunteers.Add(volunteer);
        }

        if (validVolunteers.Count > 0)
        {
            await volunteerRepository.AddRangeAsync(validVolunteers, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        return new ImportVolunteersResultDto(
            TotalRows: rows.Count,
            SuccessfulImports: validVolunteers.Count,
            FailedImports: errors.Count,
            Error: errors
        );
    }
}
