using System.Net;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Infrastructure.Persistence.Interceptors;

public class AuditSaveChangesInterceptor(
    ICurrentUserService currentUserService,
    ILogger<AuditSaveChangesInterceptor> logger) : SaveChangesInterceptor
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
        WriteIndented = false
    };

    private static readonly HashSet<string> ExcludedEntities = new(StringComparer.OrdinalIgnoreCase)
    {
        nameof(AuditLog),
        nameof(RefreshToken),
        nameof(PasswordResetToken)
    };

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        UpdateAuditableEntitiesAndCollectLogs(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        UpdateAuditableEntitiesAndCollectLogs(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private void UpdateAuditableEntitiesAndCollectLogs(DbContext? context)
    {
        if (context == null) return;

        var now = DateTimeOffset.UtcNow;
        var userId = currentUserService.UserId;
        var userEmail = currentUserService.UserEmail;
        var ipAddressStr = currentUserService.IpAddress;

        IPAddress? parsedIp = null;
        if (!string.IsNullOrWhiteSpace(ipAddressStr) && IPAddress.TryParse(ipAddressStr, out var ip))
        {
            parsedIp = ip;
        }

        // 1. Tự động gán CreatedAt & UpdatedAt cho các Entity kế thừa IAuditableEntity
        foreach (var entry in context.ChangeTracker.Entries<IAuditableEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.UpdatedAt = now;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = now;
            }
        }

        // 2. Thu thập Audit Log
        var auditEntries = new List<AuditLog>();

        foreach (var entry in context.ChangeTracker.Entries())
        {
            var entityName = entry.Entity.GetType().Name;

            if (ExcludedEntities.Contains(entityName) || entry.State is EntityState.Detached or EntityState.Unchanged)
            {
                continue;
            }

            Guid? entityGuid = null;
            var pkVal = entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue;
            if (pkVal is Guid g)
            {
                entityGuid = g;
            }
            else if (pkVal != null && Guid.TryParse(pkVal.ToString(), out var g2))
            {
                entityGuid = g2;
            }

            var oldValues = new Dictionary<string, object?>();
            var newValues = new Dictionary<string, object?>();
            var changedColumns = new List<string>();

            string action;

            switch (entry.State)
            {
                case EntityState.Added:
                    action = "CREATE";
                    foreach (var prop in entry.Properties)
                    {
                        if (prop.Metadata.IsPrimaryKey() && prop.CurrentValue == null) continue;
                        newValues[prop.Metadata.Name] = prop.CurrentValue;
                    }
                    break;

                case EntityState.Deleted:
                    action = "DELETE";
                    foreach (var prop in entry.Properties)
                    {
                        oldValues[prop.Metadata.Name] = prop.OriginalValue;
                    }
                    break;

                case EntityState.Modified:
                    action = "UPDATE";
                    foreach (var prop in entry.Properties)
                    {
                        if (prop.IsModified)
                        {
                            var original = prop.OriginalValue;
                            var current = prop.CurrentValue;

                            if (!Equals(original, current))
                            {
                                oldValues[prop.Metadata.Name] = original;
                                newValues[prop.Metadata.Name] = current;
                                changedColumns.Add(prop.Metadata.Name);
                            }
                        }
                    }

                    // Nếu không có cột nào thực sự đổi giá trị thì bỏ qua
                    if (changedColumns.Count == 0)
                    {
                        continue;
                    }
                    break;

                default:
                    continue;
            }

            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Action = action,
                EntityType = entityName,
                EntityId = entityGuid,
                OldValues = oldValues.Count > 0 ? JsonSerializer.Serialize(oldValues, JsonOptions) : null,
                NewValues = newValues.Count > 0 ? JsonSerializer.Serialize(newValues, JsonOptions) : null,
                IpAddress = parsedIp,
                CreatedAt = now
            };

            auditEntries.Add(auditLog);

            // Ghi structured log Serilog
            logger.LogInformation(
                "[AUDIT] {Action} on {EntityType} (Id: {EntityId}) by User: {UserId} ({UserEmail}) from IP: {IpAddress} | Changed: {ChangedColumns}",
                auditLog.Action,
                auditLog.EntityType,
                auditLog.EntityId?.ToString() ?? "N/A",
                auditLog.UserId?.ToString() ?? "Anonymous",
                userEmail ?? "N/A",
                parsedIp?.ToString() ?? "N/A",
                changedColumns.Count > 0 ? string.Join(", ", changedColumns) : "All");
        }

        if (auditEntries.Count > 0)
        {
            context.Set<AuditLog>().AddRange(auditEntries);
        }
    }
}
