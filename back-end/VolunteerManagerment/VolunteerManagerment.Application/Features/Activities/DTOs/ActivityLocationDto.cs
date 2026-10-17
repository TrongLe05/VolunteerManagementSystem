namespace VolunteerManagerment.Application.Features.Activities.DTOs;

public record ActivityLocationDto(
    Guid Id,
    Guid ActivityId,
    string Name,
    string? Address,
    decimal Latitude,
    decimal Longitude,
    decimal AllowedRadiusMeters
);
