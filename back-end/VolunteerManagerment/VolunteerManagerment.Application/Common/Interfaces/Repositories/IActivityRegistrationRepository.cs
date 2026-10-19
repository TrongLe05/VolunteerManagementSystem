using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces.Repositories;

public interface IActivityRegistrationRepository : IRepository<ActivityRegistration>
{
    Task<ActivityRegistration?> GetByActivityAndVolunteerAsync(Guid activityId, Guid volunteerId, CancellationToken cancellationToken = default);
    Task<int> CountActivityRegistrationsAsync(Guid activityId, CancellationToken cancellationToken = default);
    Task<ActivityRegistration?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
