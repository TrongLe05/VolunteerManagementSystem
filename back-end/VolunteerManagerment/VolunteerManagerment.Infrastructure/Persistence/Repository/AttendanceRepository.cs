using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence.Repository;

public class AttendanceRepository(ApplicationDbContext context) : Repository<Attendance>(context), IAttendanceRepository
{
    public Task<bool> HasAttendedAsync(Guid sessionId, Guid registrationId, CancellationToken cancellationToken = default)
    {
        return _dbSet.AnyAsync(x => x.AttendanceSessionId == sessionId && x.ActivityRegistrationId == registrationId, cancellationToken);
    }
}
