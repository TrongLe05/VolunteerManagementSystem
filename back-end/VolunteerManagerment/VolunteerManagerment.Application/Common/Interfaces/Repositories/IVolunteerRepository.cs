using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces.Repositories;

public interface IVolunteerRepository : IRepository<Volunteer>
{
    Task<Volunteer?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Volunteer?> GetByStudentCodeAsync(string studentCode, CancellationToken cancellationToken = default);
    Task<bool> IsVolunteerCodeExistsAsync(string volunteerCode, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> IsStudentCodeExistsAsync(string studentCode, Guid? excludeId = null, CancellationToken cancellationToken = default);
    Task<List<string>> GetExistingStudentCodesAsync(IEnumerable<string> studentCodes, CancellationToken cancellationToken = default);
    Task<List<Volunteer>> GetExistingVolunteersByCodesAsync(IEnumerable<string> studentCodes, CancellationToken cancellationToken = default);
}
