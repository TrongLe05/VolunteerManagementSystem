using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence.Repository;

public class AttendanceSessionRepository(ApplicationDbContext context) : Repository<AttendanceSession>(context), IAttendanceSessionRepository
{
    public Task<AttendanceSession?> GetByIdDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbSet
                .Include(x => x.Activity.Campaign)
                .Include(x => x.Activity.Locations)
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    }

    public Task<bool> HasActiveSessionAsync(Guid activityId, string type, CancellationToken cancellationToken = default)
    {
        return _dbSet.AnyAsync(x => x.ActivityId == activityId && x.Type == type && (x.EndedAt != null || x.EndedAt > DateTimeOffset.UtcNow), cancellationToken);   
    }
}
