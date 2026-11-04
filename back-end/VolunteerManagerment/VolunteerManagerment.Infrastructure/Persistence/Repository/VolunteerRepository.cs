using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence.Repository;

public class VolunteerRepository(ApplicationDbContext context) : Repository<Volunteer>(context), IVolunteerRepository
{
    public Task<Volunteer?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return _dbSet.Include(v => v.Organization).FirstOrDefaultAsync(v => v.UserId == userId, cancellationToken);
    }

    public Task<Volunteer?> GetByStudentCodeAsync(string studentCode, CancellationToken cancellationToken = default)
    {
        return _dbSet.Include(v => v.Organization).FirstOrDefaultAsync(v => v.StudentCode == studentCode, cancellationToken);
    }

    public Task<List<string>> GetExistingStudentCodesAsync(IEnumerable<string> studentCodes, CancellationToken cancellationToken = default)
    {
        return _dbSet.Where(v => v.StudentCode != null && studentCodes.Contains(v.StudentCode)).Select(v => v.StudentCode!).ToListAsync(cancellationToken);
    }

    public Task<List<Volunteer>> GetExistingVolunteersByCodesAsync(IEnumerable<string> studentCodes, CancellationToken cancellationToken = default)
    {
        return _dbSet.Where(v => v.StudentCode != null && studentCodes.Contains(v.StudentCode)).ToListAsync(cancellationToken);
    }

    public Task<bool> IsStudentCodeExistsAsync(string studentCode, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        return _dbSet.AnyAsync(v => v.StudentCode == studentCode && (!excludeId.HasValue || v.Id != excludeId.Value), cancellationToken);
    }

    public Task<bool> IsVolunteerCodeExistsAsync(string volunteerCode, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        return _dbSet.AnyAsync(v => v.VolunteerCode == volunteerCode && (!excludeId.HasValue || v.Id != excludeId.Value), cancellationToken);
    }
}
