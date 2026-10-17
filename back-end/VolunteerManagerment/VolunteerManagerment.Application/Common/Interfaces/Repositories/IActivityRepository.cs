using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces.Repositories;

public interface IActivityRepository : IRepository<Activity>
{
    Task<Activity?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
}
