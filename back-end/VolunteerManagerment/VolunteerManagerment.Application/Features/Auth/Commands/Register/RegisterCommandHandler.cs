using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Auth.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Register;

public class RegisterCommandHandler(
    IUserRepository userRepository,
    IRepository<Role> roleRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<RegisterCommand, RegisterResponseDto>
{
    public async Task<RegisterResponseDto> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var isExisted = await userRepository.IsUsernameOrEmailExistedAsync(request.Username, request.Email, cancellationToken);

        if (isExisted)
            throw new InvalidOperationException("Username hoặc Email đã được sử dụng!");

        var volunteerRole = (await roleRepository.FindAsync(r => r.Code == "VOLUNTEER", cancellationToken))
            .FirstOrDefault();

        if (volunteerRole == null)
            throw new InvalidOperationException("Vai trò của tình nguyện viên không tồn tại!");

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId,
            Username = request.Username,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            IsActive = true,
            LastLoginAt = DateTimeOffset.UtcNow,
            UserRoles = new List<UserRole>
            {
                new UserRole { RoleId = volunteerRole.Id }
            }
        };

        await userRepository.AddAsync(newUser, cancellationToken);

        await unitOfWork.SaveChangeAsync(cancellationToken);

        return new RegisterResponseDto(
            newUser.Id,
            newUser.Email
        );
    }
}
