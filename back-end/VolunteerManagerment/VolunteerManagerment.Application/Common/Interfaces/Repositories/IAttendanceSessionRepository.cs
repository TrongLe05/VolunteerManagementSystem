using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces.Repositories;

public interface IAttendanceSessionRepository : IRepository<AttendanceSession>
{
    Task<AttendanceSession?> GetByIdDetailsAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> HasActiveSessionAsync(Guid activityId, string type, CancellationToken cancellationToken = default);
}
