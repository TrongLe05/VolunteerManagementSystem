namespace VolunteerManagerment.Application.Features.Activities.DTOs;

public record ActivityRegistrationDto (
    Guid Id,
    Guid ActivityId,
    Guid VolunteerId,
    string VolunteerCode,
    string FullName,
    string? StudentCode,
    string? ClassName,
    string? Phone,
    string OrganizationName,
    string Status,
    DateTimeOffset RegisteredAt,
    DateTimeOffset? ApprovedAt,
    Guid? ApprovedBy
);
