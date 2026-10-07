using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Queries.GetVolunteers;

public class GetVolunteersQueryHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IApplicationDbContext context
) : IRequestHandler<GetVolunteersQuery, PageResult<VolunteerDto>>
{
    public async Task<PageResult<VolunteerDto>> Handle(GetVolunteersQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");

        var roles = user.UserRoles.Select(ur => ur.Role.Code).ToList();

        List<Guid>? allowedOrgs = null;

        if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
        }
        else if (roles.Contains("SUPER_ADMIN"))
        {
            allowedOrgs = null;
        }
        else
        {
            throw new UnauthorizedAccessException("Người dùng không có quyền truy cập danh sách tình nguyện viên.");
        }

        var query = context.Volunteers.Include(v => v.Organization).AsNoTracking();

        if (allowedOrgs != null)
        {
            query = query.Where(v => allowedOrgs.Contains(v.OrganizationId));
        }

        if (request.OrganizationId.HasValue)
        {
            query = query.Where(v => v.OrganizationId == request.OrganizationId.Value);
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(v => v.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var searchTerm = request.SearchTerm.Trim().ToLower();
            query = query.Where(v =>
                v.FullName.ToLower().Contains(searchTerm) ||
                (v.StudentCode != null && v.StudentCode.ToLower().Contains(searchTerm)) || 
                v.VolunteerCode.ToLower().Contains(searchTerm)
            );
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var items = await query
            .OrderByDescending(v => v.CreatedAt)
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(v => new VolunteerDto(
                v.Id,
                v.UserId,
                v.OrganizationId,
                v.Organization.Name,
                v.VolunteerCode,
                v.StudentCode,
                v.FullName,
                v.Gender,
                v.Phone,
                v.ClassName,
                v.DateOfBirth,
                v.JoinedAt,
                v.ConsentFaceAuth,
                v.ConsentGivenAt
            )).ToListAsync(cancellationToken);

        return new PageResult<VolunteerDto>(items, totalCount, request.PageNumber, request.PageSize);   
    }
}
