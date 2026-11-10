namespace VolunteerManagerment.Application.Features.Activities.DTOs;

public record ActivityDto(
    Guid Id,
    Guid CampaignId,
    string CampaignName,
    Guid OrganizationId,
    string OrganizationName,
    string Name,
    string? Description,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    int? Capacity,
    decimal CreditDays,
    string Status,
    Guid CreatedBy,
    int RegisteredCount,
    List<ActivityLocationDto> Locations
);
