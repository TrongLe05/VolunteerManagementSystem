using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces.Repositories;

public interface ICampaignRepository : IRepository<Campaign>
{
    Task<Campaign?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> IsCampaignExistsAsync(Guid id, Guid organizationId, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
