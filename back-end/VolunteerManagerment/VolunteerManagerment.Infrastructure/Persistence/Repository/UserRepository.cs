using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence.Repository;

public class UserRepository(ApplicationDbContext context) : Repository<User>(context), IUserRepository
{
    public async Task<User?> GetByUserNameOrEmailAsync(string usernameOrEmail, CancellationToken cancellationToken = default)
    {
        return await _dbSet
                .Include(u => u.Organization)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Username == usernameOrEmail || u.Email == usernameOrEmail, cancellationToken);
    }
    public async Task<bool> IsUsernameOrEmailExistedAsync(string username, string email, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(u => u.Username == username || u.Email == email, cancellationToken);
    }
    public async Task<User?> GetByIdWithDetailsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
                .Include(u => u.Organization)
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
    }
}
