using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.CloseAttendanceSession;

public class CloseAttendanceSessionCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CloseAttendanceSessionCommand, bool>
{
    public async Task<bool> Handle(CloseAttendanceSessionCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var currentUser = await userRepository.GetByIdWithDetailsAsync(currentUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var session = await context.AttendanceSessions
            .Include(s => s.Activity)
                .ThenInclude(a => a.Campaign)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId, cancellationToken)
            ?? throw new KeyNotFoundException("Phiên điểm danh không tồn tại.");

        var roles = currentUser.UserRoles.Select(ur => ur.Role.Code).ToList();
        if (!roles.Contains("SUPER_ADMIN"))
        {
            if (roles.Contains("ORGANIZATION_ADMIN"))
            {
                var allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(currentUser.OrganizationId, cancellationToken);
                if (!allowedOrgIds.Contains(session.Activity.Campaign.OrganizationId))
                {
                    throw new UnauthorizedAccessException("Bạn không có quyền quản lý phiên điểm danh này.");
                }
            }
            else
            {
                throw new UnauthorizedAccessException("Bạn không có quyền đóng phiên điểm danh.");
            }
        }

        session.Close(DateTimeOffset.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
