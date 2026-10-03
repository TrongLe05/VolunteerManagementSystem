using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetMyProfile;

public class GetMyProfileQueryHandler(
    ICurrentUserService currentUserService,
    IVolunteerRepository volunteerRepository
) : IRequestHandler<GetMyProfileQuery, VolunteerDto>
{
    public async Task<VolunteerDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId;
        if (userId is null)
            throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var volunteer = await volunteerRepository.GetByUserIdAsync(userId.Value)
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ tình nguyện viên cho người dùng này.");

        return new VolunteerDto(
            volunteer.Id,
            volunteer.UserId,
            volunteer.OrganizationId,
            volunteer.Organization?.Name ?? string.Empty,
            volunteer.VolunteerCode,
            volunteer.StudentCode,
            volunteer.FullName,
            volunteer.Gender,
            volunteer.Phone,
            volunteer.ClassName,
            volunteer.DateOfBirth,
            volunteer.JoinedAt,
            volunteer.ConsentFaceAuth,
            volunteer.ConsentGivenAt
        );
    }
}
