using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Models;
using VolunteerManagerment.Application.Features.AuditLogs.DTOs;

namespace VolunteerManagerment.Application.Features.AuditLogs.Queries.GetAuditLogs;

public class GetAuditLogsQueryHandler(IApplicationDbContext context)
    : IRequestHandler<GetAuditLogsQuery, PageResult<AuditLogDto>>
{
    public async Task<PageResult<AuditLogDto>> Handle(
        GetAuditLogsQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.AuditLogs
            .Include(a => a.User)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.EntityType))
        {
            var entityType = request.EntityType.Trim().ToLower();
            query = query.Where(a => a.EntityType.ToLower() == entityType);
        }

        if (!string.IsNullOrWhiteSpace(request.Action))
        {
            var action = request.Action.Trim().ToUpper();
            query = query.Where(a => a.Action.ToUpper() == action);
        }

        if (!string.IsNullOrWhiteSpace(request.ActorType))
        {
            var actorType = request.ActorType.Trim().ToUpperInvariant();
            query = actorType switch
            {
                "USER" => query.Where(a => a.UserId != null),
                "SYSTEM" => query.Where(a => a.UserId == null && a.IpAddress == null),
                "ANONYMOUS" => query.Where(a => a.UserId == null && a.IpAddress != null),
                _ => query
            };
        }

        if (request.UserId.HasValue)
        {
            query = query.Where(a => a.UserId == request.UserId.Value);
        }

        if (request.EntityId.HasValue)
        {
            query = query.Where(a => a.EntityId == request.EntityId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim().ToLower();
            var isSystemKeyword = "hệ thống".Contains(search) || "he thong".Contains(search) || "system".Contains(search);
            var isAnonymousKeyword = "anonymous".Contains(search) || "khách".Contains(search) || "vô danh".Contains(search);

            query = query.Where(a =>
                (a.User != null && a.User.Email.ToLower().Contains(search)) ||
                (a.User != null && a.User.Username.ToLower().Contains(search)) ||
                (isSystemKeyword && a.UserId == null && a.IpAddress == null) ||
                (isAnonymousKeyword && a.UserId == null && a.IpAddress != null) ||
                a.EntityType.ToLower().Contains(search) ||
                (a.OldValues != null && a.OldValues.ToLower().Contains(search)) ||
                (a.NewValues != null && a.NewValues.ToLower().Contains(search)));
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(a => a.CreatedAt <= request.ToDate.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);

        var pageNumber = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var pageSize = request.PageSize <= 0 ? 20 : request.PageSize;

        var items = await query
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditLogDto(
                a.Id,
                a.UserId,
                a.User != null ? a.User.Email : null,
                a.UserId != null
                    ? "USER"
                    : (a.IpAddress != null ? "ANONYMOUS" : "SYSTEM"),
                a.Action,
                a.EntityType,
                a.EntityId,
                a.OldValues,
                a.NewValues,
                a.IpAddress != null ? a.IpAddress.ToString() : null,
                a.CreatedAt
            ))
            .ToListAsync(cancellationToken);

        return new PageResult<AuditLogDto>(items, totalCount, pageNumber, pageSize);
    }
}
