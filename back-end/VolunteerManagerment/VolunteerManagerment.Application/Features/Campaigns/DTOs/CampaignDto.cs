namespace VolunteerManagerment.Application.Features.Campaigns.DTOs;

public record CampaignDto (
    Guid Id,
    string Name,
    string? Description,
    DateOnly StartDate,
    DateOnly EndDate,
    string Status,
    Guid OrganizationId,
    string OrganizationName,
    Guid CreatedBy
);