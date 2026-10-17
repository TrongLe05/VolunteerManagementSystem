using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence.Repository;

public class ActivityRepository(ApplicationDbContext context) : Repository<Activity>(context), IActivityRepository
{
    Task<Activity?> IActivityRepository.GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken)
    {
        return _dbSet
            .Include(a => a.Campaign)
                .ThenInclude(c => c.Organization)
            .Include(a => a.Locations)
            .Include(a => a.Creator)
                .ThenInclude(u => u.Organization)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }
}
