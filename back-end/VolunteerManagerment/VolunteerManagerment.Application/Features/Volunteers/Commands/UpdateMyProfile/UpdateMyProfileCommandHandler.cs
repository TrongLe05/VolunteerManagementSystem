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
        
        var volunteer = await volunteerRepository.GetByUserIdAsync(userId) 
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ tình nguyện viên.");

        volunteer.FullName = request.FullName;
        volunteer.Phone = request.Phone;
        volunteer.Gender = request.Gender;
        volunteer.DateOfBirth = request.DateOfBirth;
        volunteer.ClassName = request.ClassName;

        if (string.IsNullOrEmpty(volunteer.StudentCode) && !string.IsNullOrEmpty(request.StudentCode))
        {
            var isStudentCodeExists = await volunteerRepository.IsStudentCodeExistsAsync(request.StudentCode, volunteer.Id, cancellationToken);
            if (isStudentCodeExists)
            {
                throw new InvalidOperationException("Mã sinh viên đã tồn tại.");
            }
            volunteer.StudentCode = request.StudentCode;
        }
        volunteer.StudentCode = request.StudentCode;

        if (request.ConsentFaceAuth && !volunteer.ConsentFaceAuth)
        {
            volunteer.ConsentGivenAt = DateTimeOffset.UtcNow;
        } else if (!request.ConsentFaceAuth)
        {
            volunteer.ConsentGivenAt = null;
        }

        volunteer.ConsentFaceAuth = request.ConsentFaceAuth;
        volunteer.UpdatedAt = DateTimeOffset.UtcNow;

        volunteerRepository.Update(volunteer);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
