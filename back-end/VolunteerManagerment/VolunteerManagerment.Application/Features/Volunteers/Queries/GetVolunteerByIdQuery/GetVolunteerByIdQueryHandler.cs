using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetVolunteerByIdQuery;

public class GetVolunteerByIdQueryHandler(
    IApplicationDbContext context,
    IOrganizationRepository organizationRepository,
    IUserRepository userRepository,
    ICurrentUserService currentUserService
) : IRequestHandler<GetVolunteerByIdQuery, VolunteerDto>
{
    public async Task<VolunteerDto> Handle(GetVolunteerByIdQuery request, CancellationToken cancellationToken)
    {
        var volunteer = context.Volunteers.Include(v => v.Organization).AsNoTracking().FirstOrDefault(v => v.Id == request.Id)
            ?? throw new KeyNotFoundException("Không tim thấy tình nguyện viên.");

        var userId = currentUserService.UserId ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Không tìm thấy người dùng.");

        var roles = user.UserRoles.Select(r => r.Role.Code).ToList();

        if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(volunteer.OrganizationId))
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập thông tin tình nguyện viên này.");
        }
        else if (!roles.Contains("SUPER_ADMIN"))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập thông tin tình nguyện viên này.");
        }

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
