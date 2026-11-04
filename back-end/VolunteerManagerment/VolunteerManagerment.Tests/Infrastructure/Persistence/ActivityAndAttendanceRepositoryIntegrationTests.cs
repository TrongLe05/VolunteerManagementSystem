using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using VolunteerManagerment.Infrastructure.Persistence.Repository;
using Xunit;

namespace VolunteerManagerment.Tests.Infrastructure.Persistence;

public class ActivityAndAttendanceRepositoryIntegrationTests
{
    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task ActivityAndRegistrationRepositories_ShouldLoadDetailsAndCountActiveRegistrationsOnly()
    {
        await using var context = CreateDbContext();
        var unitOfWork = new UnitOfWork(context);
        IActivityRepository activityRepo = new ActivityRepository(context);
        var regRepo = new ActivityRegistrationRepository(context);

        var org = new Organization { Id = Guid.NewGuid(), Code = "DT", Name = "Đoàn Trường", IsActive = true };
        var creator = new User { Id = Guid.NewGuid(), OrganizationId = org.Id, Organization = org, Username = "admin" };
        var campaign = new Campaign { Id = Guid.NewGuid(), OrganizationId = org.Id, Organization = org, Name = "Mùa Hè Xanh", CreatedBy = creator.Id };
        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            CampaignId = campaign.Id,
            Campaign = campaign,
            CreatedBy = creator.Id,
            Creator = creator,
            Name = "Trồng cây xanh",
            Status = "OPEN",
            Locations =
            [
                new ActivityLocation { Id = Guid.NewGuid(), Name = "Công viên Văn Miếu", Latitude = 10.45m, Longitude = 105.63m, AllowedRadiusMeters = 150m }
            ]
        };

        var v1 = new Volunteer { Id = Guid.NewGuid(), OrganizationId = org.Id, FullName = "TNV 1", VolunteerCode = "V1" };
        var v2 = new Volunteer { Id = Guid.NewGuid(), OrganizationId = org.Id, FullName = "TNV 2", VolunteerCode = "V2" };
        var v3 = new Volunteer { Id = Guid.NewGuid(), OrganizationId = org.Id, FullName = "TNV 3", VolunteerCode = "V3" };

        var regRegistered = new ActivityRegistration { Id = Guid.NewGuid(), ActivityId = activity.Id, Activity = activity, VolunteerId = v1.Id, Volunteer = v1, Status = "REGISTERED" };
        var regApproved = new ActivityRegistration { Id = Guid.NewGuid(), ActivityId = activity.Id, Activity = activity, VolunteerId = v2.Id, Volunteer = v2, Status = "APPROVED" };
        var regCancelled = new ActivityRegistration { Id = Guid.NewGuid(), ActivityId = activity.Id, Activity = activity, VolunteerId = v3.Id, Volunteer = v3, Status = "CANCELLED" };

        context.Organizations.Add(org);
        context.Users.Add(creator);
        context.Campaigns.Add(campaign);
        context.Activities.Add(activity);
        context.Volunteers.AddRange(v1, v2, v3);
        context.ActivityRegistrations.AddRange(regRegistered, regApproved, regCancelled);
        await unitOfWork.SaveChangesAsync();

        // 1. Kiểm tra GetByIdWithDetailsAsync của ActivityRepository
        var loadedActivity = await activityRepo.GetByIdWithDetailsAsync(activity.Id);
        loadedActivity.Should().NotBeNull();
        loadedActivity!.Campaign.Name.Should().Be("Mùa Hè Xanh");
        loadedActivity.Locations.Should().ContainSingle().Which.Name.Should().Be("Công viên Văn Miếu");

        // 2. Kiểm tra CountActivityRegistrationsAsync: chỉ đếm REGISTERED và APPROVED (không đếm CANCELLED)
        var count = await regRepo.CountActivityRegistrationsAsync(activity.Id);
        count.Should().Be(2);

        // 3. Kiểm tra GetByActivityAndVolunteerAsync & GetByIdWithDetailsAsync
        var foundReg = await regRepo.GetByActivityAndVolunteerAsync(activity.Id, v1.Id);
        foundReg.Should().NotBeNull();
        foundReg!.Id.Should().Be(regRegistered.Id);

        var regDetails = await regRepo.GetByIdWithDetailsAsync(regApproved.Id);
        regDetails.Should().NotBeNull();
        regDetails!.Volunteer.FullName.Should().Be("TNV 2");
        regDetails.Activity.Campaign.Name.Should().Be("Mùa Hè Xanh");
    }

    [Fact]
    public async Task AttendanceSessionAndAttendanceRepositories_ShouldCheckActiveSessionAndAttendanceCorrectly()
    {
        await using var context = CreateDbContext();
        var sessionRepo = new AttendanceSessionRepository(context);
        var attendanceRepo = new AttendanceRepository(context);

        var org = new Organization { Id = Guid.NewGuid(), Code = "DT", Name = "Đoàn Trường", IsActive = true };
        var campaign = new Campaign { Id = Guid.NewGuid(), OrganizationId = org.Id, Name = "Chiến dịch" };
        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            CampaignId = campaign.Id,
            Campaign = campaign,
            Name = "Hoạt động",
            Locations = [new ActivityLocation { Id = Guid.NewGuid(), Name = "Điểm A", Latitude = 10.46m, Longitude = 105.64m }]
        };
        var activeSession = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            Activity = activity,
            Type = "CHECK_IN",
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-5),
            EndedAt = DateTimeOffset.UtcNow.AddMinutes(10)
        };
        var expiredSession = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            Activity = activity,
            Type = "CHECK_OUT",
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-30),
            EndedAt = DateTimeOffset.UtcNow.AddMinutes(-5)
        };

        var registrationId = Guid.NewGuid();
        var attendance = new Attendance
        {
            Id = Guid.NewGuid(),
            AttendanceSessionId = activeSession.Id,
            ActivityRegistrationId = registrationId,
            Status = "APPROVED",
            LocationStatus = "VALID",
            VerificationMethod = "FACE_RECOGNITION"
        };

        context.Organizations.Add(org);
        context.Campaigns.Add(campaign);
        context.Activities.Add(activity);
        context.AttendanceSessions.AddRange(activeSession, expiredSession);
        context.Attendances.Add(attendance);
        await context.SaveChangesAsync();

        (await sessionRepo.HasActiveSessionAsync(activity.Id, "CHECK_IN")).Should().BeTrue();
        (await sessionRepo.HasActiveSessionAsync(activity.Id, "CHECK_OUT")).Should().BeFalse();

        var sessionDetails = await sessionRepo.GetByIdDetailsAsync(activeSession.Id);
        sessionDetails.Should().NotBeNull();
        sessionDetails!.Activity.Locations.Should().ContainSingle();

        (await attendanceRepo.HasAttendedAsync(activeSession.Id, registrationId)).Should().BeTrue();
        (await attendanceRepo.HasAttendedAsync(activeSession.Id, Guid.NewGuid())).Should().BeFalse();
    }
}
