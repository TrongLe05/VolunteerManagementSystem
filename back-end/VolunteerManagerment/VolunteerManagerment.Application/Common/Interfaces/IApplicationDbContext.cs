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
    DbSet<Activity> Activities { get; }
    DbSet<ActivityLocation> ActivityLocations { get; }
    DbSet<ActivityRegistration> ActivityRegistrations { get; }
    DbSet<AttendanceSession> AttendanceSessions { get; }
    DbSet<Attendance> Attendances { get; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
