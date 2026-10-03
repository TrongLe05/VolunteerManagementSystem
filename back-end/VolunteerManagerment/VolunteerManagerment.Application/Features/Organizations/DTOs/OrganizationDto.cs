namespace VolunteerManagerment.Application.Features.Organizations.DTOs;

public record OrganizationDto(
    Guid Id,
    Guid? ParentId,
    string? ParentName,
    string Code,
    string Name, 
    string? Description,
    bool IsActive
);