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
            .Select(r => r.ResolveStudentCode()?.Trim())
            .Where(code => !string.IsNullOrWhiteSpace(code))
            .Select(code => code!)
            .Distinct().ToList();

        var existingVolunteers = await volunteerRepository.GetExistingVolunteersByCodesAsync(excelStudentCode, cancellationToken);
        var existingVolunteersMap = existingVolunteers.ToDictionary(v => v.StudentCode!, StringComparer.OrdinalIgnoreCase);

        var seenCodesInFile = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var errors = new List<string>();
        var validVolunteers = new List<Volunteer>();
        var updatedVolunteersCount = 0;

        for (int i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            int rowNumber = i + 2; // Dòng 1 là tiêu đề (Header), dữ liệu bắt đầu từ dòng 2

            var fullName = row.ResolveFullName()?.Trim();
            var rawStudentCode = row.ResolveStudentCode()?.Trim();
            var className = row.ResolveClassName()?.Trim();
            var rawGender = row.ResolveGender()?.Trim();
            var phone = row.ResolvePhone()?.Trim();
            var dobString = row.ResolveDateOfBirth()?.Trim();

            // 0. Bỏ qua dòng trống hoàn toàn (thường là ô thừa do định dạng cuối file Excel)
            if (string.IsNullOrWhiteSpace(fullName) && string.IsNullOrWhiteSpace(rawStudentCode) && string.IsNullOrWhiteSpace(className))
            {
                continue;
            }

            // 1. Kiểm tra Họ và tên
            if (string.IsNullOrWhiteSpace(fullName))
            {
                errors.Add($"Dòng {rowNumber}: Họ và tên không được để trống.");
                continue;
            }

            // 2. Kiểm tra MSSV
            if (string.IsNullOrWhiteSpace(rawStudentCode))
            {
                errors.Add($"Dòng {rowNumber}: MSSV không được để trống.");
                continue;
            }

            var studentCode = rawStudentCode;

            // 3. Kiểm tra trùng MSSV trong chính file Excel
            if (!seenCodesInFile.Add(studentCode))
            {
                errors.Add($"Dòng {rowNumber}: MSSV '{studentCode}' bị trùng lặp trong file Excel.");
                continue;
            }

            // 4. Chuẩn hóa giới tính về chuẩn DB ('MALE' / 'FEMALE' / 'OTHER')
            string? normalizedGender = rawGender?.ToUpper() switch
            {
                "NAM" or "MALE" => "MALE",
                "NỮ" or "NU" or "FEMALE" => "FEMALE",
                "KHÁC" or "OTHER" => "OTHER",
                _ => null
            };

            // 5. Parse ngày sinh an toàn (hỗ trợ nhiều định dạng ngày thông dụng)
            DateOnly? parsedDob = null;
            if (!string.IsNullOrWhiteSpace(dobString))
            {
                if (DateOnly.TryParseExact(dobString, new[] { "dd/MM/yyyy", "d/M/yyyy", "yyyy-MM-dd", "d-M-yyyy", "dd-MM-yyyy" }, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dob))
                {
                    parsedDob = dob;
                }
            }

            // 6. Nếu sinh viên đã có trong hệ thống -> Cập nhật thông tin (đặc biệt là Tên lớp)
            if (existingVolunteersMap.TryGetValue(studentCode, out var existingVolunteer))
            {
                if (!string.IsNullOrWhiteSpace(className)) existingVolunteer.ClassName = className;
                if (!string.IsNullOrWhiteSpace(fullName)) existingVolunteer.FullName = fullName;
                if (normalizedGender != null) existingVolunteer.Gender = normalizedGender;
                if (parsedDob.HasValue) existingVolunteer.DateOfBirth = parsedDob.Value;
                if (!string.IsNullOrWhiteSpace(phone)) existingVolunteer.Phone = phone;
                existingVolunteer.UpdatedAt = DateTimeOffset.UtcNow;

                updatedVolunteersCount++;
                continue;
            }

            // 7. Tạo Entity Volunteer mới nếu chưa có
            var volunteer = new Volunteer
            {
                Id = Guid.NewGuid(),
                OrganizationId = request.OrganizationId,
                VolunteerCode = $"TNV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..6].ToUpper()}",
                StudentCode = studentCode,
                FullName = fullName,
                ClassName = className,
                Gender = normalizedGender,
                DateOfBirth = parsedDob,
                Phone = phone,
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
        }

        if (validVolunteers.Count > 0 || updatedVolunteersCount > 0)
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }

        var totalProcessed = validVolunteers.Count + updatedVolunteersCount + errors.Count;

        return new ImportVolunteersResultDto(
            TotalRows: totalProcessed > 0 ? totalProcessed : rows.Count,
            SuccessfulImports: validVolunteers.Count + updatedVolunteersCount,
            FailedImports: errors.Count,
            Error: errors
        );
    }
}
