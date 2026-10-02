using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces.Repositories;

public interface IOrganizationRepository : IRepository<Organization>
{
    Task<bool> IsCodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<List<Guid>> GetSubOrganizationIdsAsync(Guid rootOrganizationId, CancellationToken cancellationToken = default);
    Task<Organization?> GetByIdWithChildrenAsync(Guid id, CancellationToken cancellationToken = default);
}
