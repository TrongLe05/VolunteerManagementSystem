using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence.Repository;

public class ActivityRegistrationRepository(ApplicationDbContext context) : Repository<ActivityRegistration>(context), IActivityRegistrationRepository
{
    public Task<int> CountActivityRegistrationsAsync(Guid activityId, CancellationToken cancellationToken = default)
    {
        return _dbSet.CountAsync(ar => ar.ActivityId == activityId && (ar.Status == "REGISTERED" || ar.Status == "APPROVED"), cancellationToken);
    }

    public Task<ActivityRegistration?> GetByActivityAndVolunteerAsync(Guid activityId, Guid volunteerId, CancellationToken cancellationToken = default)
    {
        return _dbSet.FirstOrDefaultAsync(ar => ar.ActivityId == activityId && ar.VolunteerId == volunteerId, cancellationToken);
    }

    public Task<ActivityRegistration?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbSet.Include(ar => ar.Activity.Campaign).Include(ar => ar.Volunteer).Include(ar => ar.Approved).FirstOrDefaultAsync(ar => ar.Id == id, cancellationToken);               
    }
}
