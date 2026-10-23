using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces.Repositories;

public interface IAttendanceRepository : IRepository<Attendance>
{
    Task<bool> HasAttendedAsync(Guid sessionId, Guid registrationId, CancellationToken cancellationToken = default);
}
