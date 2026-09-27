using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Features.Auth.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Register;

public class RegisterCommandHandler(IApplicationDbContext context) : IRequestHandler<RegisterCommands, RegisterResponseDto>
{
    public async Task<RegisterResponseDto> Handle(RegisterCommands request, CancellationToken cancellationToken)
    {
        var isExisted = await context.Users
        .AnyAsync(u => u.Username == request.Username || u.Email == request.Email, cancellationToken);

        if (isExisted)
            throw new InvalidOperationException("Username hoặc Email đã được sử dụng!");

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId,
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true,
            LastLoginAt = DateTimeOffset.UtcNow
        };

        context.Users.Add(newUser);

        var volunteerRole = await context.Roles
               .FirstOrDefaultAsync(r => r.Name == "Volunteer", cancellationToken);

        if (volunteerRole != null)
        {
            context.UserRoles.Add(new UserRole
            {
                UserId = newUser.Id,
                RoleId = volunteerRole.Id
            });
        }

        await context.SaveChangesAsync(cancellationToken);

        return new RegisterResponseDto(
            newUser.Id,
            newUser.Email
            //newUser.Name
        );
    }
}
