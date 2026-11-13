namespace VolunteerManagerment.Application.Features.AuditLogs.DTOs;

public record AuditLogDto(
    Guid Id,
    Guid? UserId,
    string? UserEmail,
    string ActorType,
    string Action,
    string EntityType,
    Guid? EntityId,
    string? OldValues,
    string? NewValues,
    string? IpAddress,
    DateTimeOffset CreatedAt
);
