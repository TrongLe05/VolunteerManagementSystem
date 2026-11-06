namespace VolunteerManagerment.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? UserEmail { get; }
    string? IpAddress { get; }
}
