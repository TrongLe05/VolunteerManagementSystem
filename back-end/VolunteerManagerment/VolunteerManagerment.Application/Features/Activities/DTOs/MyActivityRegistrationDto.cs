namespace VolunteerManagerment.Application.Features.Activities.DTOs;

public record MyActivityRegistrationDto(
    Guid RegistrationId,
    Guid ActivityId,
    string ActivityName,
    string CampaignName,
    string OrganizationName,
    DateTimeOffset StartTime,
    DateTimeOffset EndTime,
    decimal CreditDay,
    decimal CreditHour,
    string ActivityStatus,
    string RegistrationStatus,
    DateTimeOffset RegisteredAt,
    DateTimeOffset? ApproveAt
);
