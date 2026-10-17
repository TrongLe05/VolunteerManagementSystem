using MediatR;

namespace VolunteerManagerment.Application.Features.Activities.Commands.UpdateActivity;

public record UpdateActivityCommand(
    Guid Id,
    string Name,
    string? Description,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    int? Capacity,
    decimal CreditHours,
    decimal CreditDays,
    string Status,
    List<UpdateActivityLocationRequest> Locations
) : IRequest<bool>;

public record UpdateActivityLocationRequest(
    string Name,
    string? Address,
    decimal Latitude,
    decimal Longitude,
    decimal AllowedRadiusMeters = 100.0m
);