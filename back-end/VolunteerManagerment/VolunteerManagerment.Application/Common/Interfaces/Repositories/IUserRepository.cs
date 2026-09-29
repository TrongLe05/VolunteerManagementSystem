using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByUserNameOrEmailAsync(string usernameOrEmail, CancellationToken cancellationToken = default);
    Task<bool> IsUsernameOrEmailExistedAsync(string username, string email, CancellationToken cancellationToken = default);
    Task<User?> GetByIdWithDetailsAsync(Guid userId, CancellationToken cancellationToken = default);
}
