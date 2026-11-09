using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Infrastructure.Persistence;

namespace VolunteerManagerment.Infrastructure.BackgroundJobs;

public class ActivityStatusWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<ActivityStatusWorker> logger
) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(1);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("ActivityStatusWorker đã khởi động: {time}", DateTimeOffset.Now);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await UpdateStatusesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Lỗi xảy ra trong quá trình cập nhật trạng thái hoạt động tự động.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task UpdateStatusesAsync(CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var now = DateTimeOffset.UtcNow;
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        // 1. Tự động chuyển OPEN / UPCOMING / PUBLISHED -> ONGOING khi đã đến giờ bắt đầu (StartTime <= now < EndTime)
        var startedCount = await dbContext.Activities
            .Where(a => (a.Status == "OPEN" || a.Status == "UPCOMING" || a.Status == "PUBLISHED") && a.StartTime <= now && a.EndTime > now)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Status, "ONGOING")
                .SetProperty(a => a.UpdatedAt, now), cancellationToken);

        // 2. Tự động chuyển OPEN / ONGOING / UPCOMING / PUBLISHED -> COMPLETED khi đã qua thời gian kết thúc (EndTime <= now)
        var endedCount = await dbContext.Activities
            .Where(a => (a.Status == "OPEN" || a.Status == "ONGOING" || a.Status == "UPCOMING" || a.Status == "PUBLISHED") && a.EndTime <= now)
            .ExecuteUpdateAsync(s => s
                .SetProperty(a => a.Status, "COMPLETED")
                .SetProperty(a => a.UpdatedAt, now), cancellationToken);

        // 3. (Tùy chọn) Tự động cập nhật Chiến dịch (Campaign)
        // UPCOMING -> ONGOING khi StartDate <= today
        var campStarted = await dbContext.Campaigns
            .Where(c => (c.Status == "UPCOMING" || c.Status == "DRAFT") && c.StartDate <= today && c.EndDate >= today)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.Status, "ONGOING")
                .SetProperty(c => c.UpdatedAt, now), cancellationToken);

        // ONGOING -> COMPLETED khi EndDate < today
        var campEnded = await dbContext.Campaigns
            .Where(c => c.Status == "ONGOING" && c.EndDate < today)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.Status, "COMPLETED")
                .SetProperty(c => c.UpdatedAt, now), cancellationToken);

        var notificationService = scope.ServiceProvider.GetService<IDashboardNotificationService>();

        if (startedCount > 0 || endedCount > 0)
        {
            logger.LogInformation("Đã tự động cập nhật: {Started} hoạt động sang ONGOING, {Ended} hoạt động sang COMPLETED.",
                startedCount, endedCount);
            if (notificationService != null)
            {
                await notificationService.NotifyActivityChangedAsync(cancellationToken);
            }
        }

        if (campStarted > 0 || campEnded > 0)
        {
            if (notificationService != null)
            {
                await notificationService.NotifyCampaignChangedAsync(cancellationToken);
            }
        }
    }
}
