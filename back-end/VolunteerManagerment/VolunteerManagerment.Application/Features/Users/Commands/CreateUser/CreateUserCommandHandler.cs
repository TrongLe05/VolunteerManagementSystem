using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Users.Commands.CreateUser;

public class CreateUserCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    IPasswordHasher passwordHasher,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateUserCommand, Guid>
{
    public async Task<Guid> Handle(CreateUserCommand request, CancellationToken cancellationToken)
    {
        var currentUserId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được danh tính người dùng.");

        var currentUser = await userRepository.GetByIdWithDetailsAsync(currentUserId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var currentUserRoles = currentUser.UserRoles.Select(ur => ur.Role.Code).ToList();
        var isSuperAdmin = currentUserRoles.Contains("SUPER_ADMIN");

        if (!isSuperAdmin)
        {
            if (!currentUserRoles.Contains("ORGANIZATION_ADMIN"))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền tạo tài khoản người dùng.");
            }

            // Organization Admin cannot create Super Admin
            if (request.RoleCodes.Any(r => r.Equals("SUPER_ADMIN", StringComparison.OrdinalIgnoreCase)))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền phân quyền Quản trị viên cấp cao (SUPER_ADMIN).");
            }

            // Check organization boundary
            var allowedOrgIds = await organizationRepository.GetSubOrganizationIdsAsync(currentUser.OrganizationId, cancellationToken);
            if (!allowedOrgIds.Contains(request.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn chỉ có thể tạo tài khoản thuộc đơn vị Đoàn - Hội do bạn quản lý.");
            }
        }

        var normalizedUsername = request.Username.Trim().ToLower();
        var isUsernameExists = await context.Users
            .AnyAsync(u => u.Username.ToLower() == normalizedUsername, cancellationToken);
        if (isUsernameExists)
        {
            throw new InvalidOperationException($"Tên đăng nhập '{request.Username.Trim()}' đã được sử dụng.");
        }

        var normalizedEmail = request.Email.Trim().ToLower();
        var isEmailExists = await context.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail, cancellationToken);
        if (isEmailExists)
        {
            throw new InvalidOperationException($"Địa chỉ email '{request.Email.Trim()}' đã được sử dụng.");
        }

        var orgExists = await context.Organizations
            .AnyAsync(o => o.Id == request.OrganizationId, cancellationToken);
        if (!orgExists)
        {
            throw new InvalidOperationException("Đơn vị tổ chức đã chọn không tồn tại.");
        }

        var normalizedRoleCodes = request.RoleCodes
            .Select(r => r.Trim().ToUpper())
            .Distinct()
            .ToList();

        var validRoles = await context.Roles
            .Where(r => normalizedRoleCodes.Contains(r.Code.ToUpper()))
            .ToListAsync(cancellationToken);

        if (validRoles.Count == 0)
        {
            throw new InvalidOperationException("Không tìm thấy vai trò hợp lệ nào trong hệ thống.");
        }

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username.Trim(),
            Email = request.Email.Trim(),
            PasswordHash = passwordHasher.HashPassword(request.Password),
            OrganizationId = request.OrganizationId,
            IsActive = request.IsActive,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
        };

        foreach (var role in validRoles)
        {
            newUser.UserRoles.Add(new UserRole
            {
                UserId = newUser.Id,
                RoleId = role.Id
            });
        }

        await context.Users.AddAsync(newUser, cancellationToken);

        // If user is a volunteer or full name is provided, create linked volunteer profile
        var isVolunteerRole = validRoles.Any(r => r.Code == "VOLUNTEER");
        if (isVolunteerRole || !string.IsNullOrWhiteSpace(request.FullName))
        {
            var volunteer = new Volunteer
            {
                Id = Guid.NewGuid(),
                UserId = newUser.Id,
                OrganizationId = newUser.OrganizationId,
                VolunteerCode = !string.IsNullOrWhiteSpace(request.StudentCode)
                    ? request.StudentCode.Trim()
                    : $"TNV{DateTimeOffset.UtcNow:yyMMddHHmmss}",
                FullName = !string.IsNullOrWhiteSpace(request.FullName)
                    ? request.FullName.Trim()
                    : newUser.Username,
                StudentCode = request.StudentCode?.Trim(),
                Phone = request.Phone?.Trim(),
                IsActive = newUser.IsActive,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            await context.Volunteers.AddAsync(volunteer, cancellationToken);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return newUser.Id;
    }
}
