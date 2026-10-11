using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence.Repository;

public class CampaignRepository(ApplicationDbContext context) : Repository<Campaign>(context), ICampaignRepository
{
    public Task<Campaign?> GetByIdWithDetailsAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return _dbSet.Include(c => c.Organization).Include(c => c.Creator)
                     .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public Task<bool> IsCampaignExistsAsync(Guid id, Guid organizationId, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        return _dbSet.AnyAsync(c => c.Id == id && c.OrganizationId == organizationId && (!excludeId.HasValue || c.Id != excludeId.Value), cancellationToken);
    }
}
