namespace VolunteerManagerment.Application.Features.Volunteers.DTOs;

public record VolunteerDto(
    Guid Id,
    Guid? UserId,
    Guid OrganizationId,
    string OrganizationName,
    string VolunteerCode,
    string? StudentCode,
    string FullName,
    string? Gender,
    string? Phone,
    string? ClassName,
    DateOnly? DateOfBirth,
    DateOnly? JoinedAt,
    bool ConsentFaceAuth,
    DateTimeOffset? ConsentGivenAt
);
