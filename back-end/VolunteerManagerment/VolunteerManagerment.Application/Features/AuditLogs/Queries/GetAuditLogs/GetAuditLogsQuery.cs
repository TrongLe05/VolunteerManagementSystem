using MediatR;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.AuditLogs.DTOs;

namespace VolunteerManagerment.Application.Features.AuditLogs.Queries.GetAuditLogs;

public record GetAuditLogsQuery(
    string? EntityType = null,
    string? Action = null,
    Guid? UserId = null,
    Guid? EntityId = null,
    string? Search = null,
    DateTimeOffset? FromDate = null,
    DateTimeOffset? ToDate = null,
    int PageNumber = 1,
    int PageSize = 20
) : IRequest<PageResult<AuditLogDto>>;
