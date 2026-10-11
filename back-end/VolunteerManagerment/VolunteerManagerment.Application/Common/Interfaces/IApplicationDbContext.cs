using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Organization> Organizations { get; }
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<Volunteer> Volunteers { get; }
    DbSet<Campaign> Campaigns { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
