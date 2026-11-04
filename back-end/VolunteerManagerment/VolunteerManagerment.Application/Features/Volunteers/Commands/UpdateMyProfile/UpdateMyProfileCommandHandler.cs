using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Volunteers.Commands.UpdateMyProfile;

public class UpdateMyProfileCommandHandler(
    ICurrentUserService currentUserService,
    IVolunteerRepository volunteerRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateMyProfileCommand, bool>
{
    public async Task<bool> Handle(UpdateMyProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId 
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");
        
        var volunteer = await volunteerRepository.GetByUserIdAsync(userId, cancellationToken) 
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ tình nguyện viên cho tài khoản này.");

        volunteer.FullName = request.FullName.Trim();
        volunteer.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        volunteer.Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim().ToUpper();
        volunteer.DateOfBirth = request.DateOfBirth;
        volunteer.ClassName = string.IsNullOrWhiteSpace(request.ClassName) ? null : request.ClassName.Trim();

        if (!string.IsNullOrWhiteSpace(request.StudentCode))
        {
            var trimmedCode = request.StudentCode.Trim();
            var existingWithCode = await volunteerRepository.GetByStudentCodeAsync(trimmedCode, cancellationToken);

            if (existingWithCode != null && existingWithCode.Id != volunteer.Id)
            {
                if (existingWithCode.UserId.HasValue && existingWithCode.UserId.Value != userId)
                {
                    throw new InvalidOperationException("Mã số sinh viên này đã được liên kết với một tài khoản khác. Vui lòng liên hệ ban quản trị Đoàn trường nếu có nhầm lẫn.");
                }

                if (!existingWithCode.UserId.HasValue)
                {
                    volunteer.InheritFromImportedRecord(existingWithCode);
                    volunteerRepository.Delete(existingWithCode);
                }
            }

            volunteer.StudentCode = trimmedCode;
        }

        volunteer.ApplyFaceBiometricConsent(request.ConsentFaceAuth, DateTimeOffset.UtcNow);

        volunteerRepository.Update(volunteer);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
