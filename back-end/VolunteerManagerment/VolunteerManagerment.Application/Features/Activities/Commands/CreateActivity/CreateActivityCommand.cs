using MediatR;
using VolunteerManagerment.Application.Features.Activities.DTOs;

namespace VolunteerManagerment.Application.Features.Activities.Commands.CreateActivity;

public record CreateActivityCommand(
    Guid CampaignId,
    string Name,
    string? Description,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    int? Capacity,
    decimal CreditDays,
    List<CreateActivityLocationRequest>? Locations = null
) : IRequest<Guid>;

public record CreateActivityLocationRequest(
    string Name, 
    string? Address,
    decimal Latitude,
    decimal Longitude,
    decimal AllowedRadiusMeters = 100.0m
);
