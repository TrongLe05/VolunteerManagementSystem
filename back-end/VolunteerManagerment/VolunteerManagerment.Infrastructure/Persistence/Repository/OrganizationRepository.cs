using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence.Repository;

public class OrganizationRepository(
    ApplicationDbContext context
) : Repository<Organization>(context), IOrganizationRepository
{
    public async Task<Organization?> GetByIdWithChildrenAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(o => o.Children)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }
    public async Task<bool> IsCodeExistsAsync(string code, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        return await _dbSet.AnyAsync(
            o => o.Code == code && (!excludeId.HasValue || o.Id != excludeId.Value),
            cancellationToken);
    }
    public async Task<List<Guid>> GetSubOrganizationIdsAsync(Guid rootOrganizationId, CancellationToken cancellationToken = default)
    {
        var allOrgs = await _dbSet
            .AsNoTracking()
            .Where(o => o.IsActive)
            .Select(o => new {o.Id, o.ParentId })
            .ToListAsync(cancellationToken);

        var result = new List<Guid> { rootOrganizationId };

        CollectChildrenRecursive(rootOrganizationId, allOrgs.Select(x => (x.Id, x.ParentId)).ToList(), result);

        return result;
    }

    private static void CollectChildrenRecursive(Guid parentId, List<(Guid Id, Guid? ParentId)> allOrgs, List<Guid> result)
    {
        var directChildren = allOrgs.Where(o => o.ParentId == parentId).Select(o => o.Id).ToList();
        foreach (var child in directChildren)
        {
            result.Add(child);
            CollectChildrenRecursive(child, allOrgs, result);
        }
    }
}
