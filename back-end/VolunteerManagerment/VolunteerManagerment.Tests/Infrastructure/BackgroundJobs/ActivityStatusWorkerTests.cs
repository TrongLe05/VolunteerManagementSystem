using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using Xunit;
using Xunit.Abstractions;

namespace VolunteerManagerment.Tests.Infrastructure.BackgroundJobs;

public class ActivityStatusWorkerTests(ITestOutputHelper output)
{
    [Fact]
    public void TestSqlGenerationForActivityStatusWorker()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql("Host=localhost;Database=test;Username=test;Password=test")
            .Options;

        using var db = new ApplicationDbContext(options);
        var now = DateTimeOffset.UtcNow;

        var query1 = db.Activities
            .Where(a => (a.Status == "OPEN" || a.Status == "UPCOMING" || a.Status == "PUBLISHED") && a.StartTime <= now && a.EndTime > now);
        var sql1 = query1.ToQueryString();
        output.WriteLine("=== QUERY 1 ===");
        output.WriteLine(sql1);

        var query2 = db.Activities
            .Where(a => (a.Status == "OPEN" || a.Status == "ONGOING" || a.Status == "UPCOMING" || a.Status == "PUBLISHED") && a.EndTime <= now);
        var sql2 = query2.ToQueryString();
        output.WriteLine("=== QUERY 2 ===");
        output.WriteLine(sql2);

        sql1.Should().NotBeNullOrEmpty();
        sql2.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task StatusTransitions_WhenNowIsBetweenStartAndEnd_ShouldBeIdentified()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new ApplicationDbContext(options);

        var org = new Organization { Id = Guid.NewGuid(), Code = "TEST", Name = "Test Org", IsActive = true };
        var creator = new User { Id = Guid.NewGuid(), OrganizationId = org.Id, Organization = org, Username = "admin" };
        var campaign = new Campaign { Id = Guid.NewGuid(), OrganizationId = org.Id, Organization = org, Name = "Campaign 1", CreatedBy = creator.Id };

        var baseTime = DateTimeOffset.UtcNow;

        var actStarted = new Activity
        {
            Id = Guid.NewGuid(),
            CampaignId = campaign.Id,
            Name = "Hoạt động đang diễn ra",
            StartTime = baseTime.AddMinutes(-10),
            EndTime = baseTime.AddMinutes(50),
            Status = "OPEN",
            CreatedBy = creator.Id
        };

        var actEnded = new Activity
        {
            Id = Guid.NewGuid(),
            CampaignId = campaign.Id,
            Name = "Hoạt động đã kết thúc",
            StartTime = baseTime.AddMinutes(-60),
            EndTime = baseTime.AddMinutes(-5),
            Status = "OPEN",
            CreatedBy = creator.Id
        };

        db.Activities.AddRange(actStarted, actEnded);
        await db.SaveChangesAsync();

        var now = baseTime;

        var startedList = await db.Activities
            .Where(a => (a.Status == "OPEN" || a.Status == "UPCOMING" || a.Status == "PUBLISHED") && a.StartTime <= now && a.EndTime > now)
            .ToListAsync();

        var endedList = await db.Activities
            .Where(a => (a.Status == "OPEN" || a.Status == "ONGOING" || a.Status == "UPCOMING" || a.Status == "PUBLISHED") && a.EndTime <= now)
            .ToListAsync();

        startedList.Should().ContainSingle(a => a.Id == actStarted.Id);
        endedList.Should().ContainSingle(a => a.Id == actEnded.Id);
    }
}
