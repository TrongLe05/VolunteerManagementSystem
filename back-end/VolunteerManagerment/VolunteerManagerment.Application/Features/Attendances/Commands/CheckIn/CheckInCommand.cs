using MediatR;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.CheckIn;

public record CheckInCommand(
    Guid ActivityId,
    decimal Latitude,
    decimal Longitude,
    decimal? LocationAccuracyMeters,
    string? CapturedImageBase64
) : IRequest<CheckInResultDto>;

public record CheckInResultDto(
    bool Success,
    string Message,
    string SessionType,
    DateTimeOffset AttendedAt,
    string LocationStatus,
    decimal DistanceMeters,
    bool IsInsideGeofence
);
