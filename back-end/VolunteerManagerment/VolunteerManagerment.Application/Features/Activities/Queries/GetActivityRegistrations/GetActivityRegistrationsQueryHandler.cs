using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Queries.GetActivityRegistrations;

public class GetActivityRegistrationsQueryHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IActivityRepository activityRepository,
    IOrganizationRepository organizationRepository
) : IRequestHandler<GetActivityRegistrationsQuery, PageResult<ActivityRegistrationDto>>
{
    public async Task<PageResult<ActivityRegistrationDto>> Handle(GetActivityRegistrationsQuery request, CancellationToken cancellationToken)
    {
        var activity = await activityRepository.GetByIdWithDetailsAsync(request.ActivityId, cancellationToken)
            ?? throw new KeyNotFoundException("Hoạt động không tồn tại.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác địnhh được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        if (roles.Contains("SUPER_ADMIN"))
        {
            
        }
        else if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if (!allowedOrgs.Contains(activity.Campaign.OrganizationId))
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập danh sách đăng ký của hoạt động này.");
        }
        else
        {
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập danh sách đăng ký của hoạt động này.");
        }

        var query = context.ActivityRegistrations
            .AsNoTracking()
            .Where(ar => ar.ActivityId == request.ActivityId);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(ar => ar.Status == request.Status);

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();
            query = query.Where(ar =>
                ar.Volunteer.FullName.ToLower().Contains(searchTerm) ||
                ar.Volunteer.StudentCode.ToLower().Contains(searchTerm) ||
                ar.Volunteer.VolunteerCode.ToLower().Contains(searchTerm)
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(ar => ar.RegisteredAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(ar => new ActivityRegistrationDto(
                ar.Id,
                ar.ActivityId,
                ar.VolunteerId,
                ar.Volunteer.VolunteerCode,
                ar.Volunteer.FullName,
                ar.Volunteer.StudentCode,
                ar.Volunteer.ClassName,
                ar.Volunteer.Phone,
                ar.Volunteer.Organization.Name,
                ar.Status,
                ar.RegisteredAt,
                ar.ApprovedAt,
                ar.ApprovedBy
            ))
            .ToListAsync(cancellationToken);

        return new PageResult<ActivityRegistrationDto> (items, totalCount, request.PageNumber, request.PageSize);
    }
}
