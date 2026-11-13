using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Attendances.Commands.ManualMarkAttendance;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Attendances;

public class ManualMarkAttendanceCommandHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenSuperAdminMarksAttendanceWithoutExistingSession_ShouldCreateSessionAndApprovedManualAttendance()
    {
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var regId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        var campaign = new Campaign
        {
            Id = campaignId,
            OrganizationId = orgId,
            Name = "Chiến dịch Xuân Tình Nguyện",
            Status = "ACTIVE"
        };
        var activity = new Activity
        {
            Id = activityId,
            CampaignId = campaignId,
            Campaign = campaign,
            Name = "Tặng quà Tết",
            Status = "ONGOING",
            CreditDays = 1.0m
        };
        var registration = new ActivityRegistration
        {
            Id = regId,
            ActivityId = activityId,
            Activity = activity,
            VolunteerId = Guid.NewGuid(),
            Status = "APPROVED"
        };

        context.Campaigns.Add(campaign);
        context.Activities.Add(activity);
        context.ActivityRegistrations.Add(registration);
        await context.SaveChangesAsync();

        var handler = new ManualMarkAttendanceCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object
        );

        var result = await handler.Handle(new ManualMarkAttendanceCommand(regId, "CHECK_IN", "Điểm danh bù tại bàn"), CancellationToken.None);

        result.Should().BeTrue();
        var attendance = await context.Attendances.FirstOrDefaultAsync(a => a.ActivityRegistrationId == regId);
        attendance.Should().NotBeNull();
        attendance!.Status.Should().Be("APPROVED");
        attendance.LocationStatus.Should().Be("VALID");
        attendance.VerificationMethod.Should().Be("MANUAL");
        attendance.CreditEarned.Should().Be(0m); // CHECK_IN chưa hoàn tất cả 2 lượt
        attendance.Note.Should().Be("Điểm danh bù tại bàn");
    }

    [Fact]
    public async Task Handle_WhenManualMarkCheckOutWithApprovedCheckIn_ShouldAwardCreditDays()
    {
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var regId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        var orgAdmin = new User
        {
            Id = userId,
            Username = "orgadmin2",
            OrganizationId = orgId,
            UserRoles = new List<UserRole>
            {
                new() { Role = new Role { Code = "ORGANIZATION_ADMIN" } }
            }
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(orgAdmin);
        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { orgId });

        var act = new Activity
        {
            Id = activityId,
            Name = "Hoạt động thử nghiệm 2",
            CreditDays = 1.0m,
            Campaign = new Campaign
            {
                Id = campaignId,
                Name = "Chiến dịch 2",
                OrganizationId = orgId
            }
        };

        var reg = new ActivityRegistration
        {
            Id = regId,
            ActivityId = activityId,
            Activity = act,
            Status = "APPROVED"
        };

        var checkInSession = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            ActivityId = activityId,
            Type = "CHECK_IN",
            StartedAt = DateTimeOffset.UtcNow.AddHours(-1)
        };
        var checkInAttendance = new Attendance
        {
            Id = Guid.NewGuid(),
            AttendanceSessionId = checkInSession.Id,
            ActivityRegistrationId = regId,
            Status = "APPROVED",
            CreditEarned = 0m,
            AttendedAt = DateTimeOffset.UtcNow.AddHours(-1)
        };

        context.Activities.Add(act);
        context.ActivityRegistrations.Add(reg);
        context.AttendanceSessions.Add(checkInSession);
        context.Attendances.Add(checkInAttendance);
        await context.SaveChangesAsync();

        var handler = new ManualMarkAttendanceCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object
        );

        var result = await handler.Handle(new ManualMarkAttendanceCommand(regId, "CHECK_OUT", "Điểm danh ra hoàn thành"), CancellationToken.None);

        result.Should().BeTrue();
        var checkOut = await context.Attendances.FirstOrDefaultAsync(a => a.ActivityRegistrationId == regId && a.AttendanceSession.Type == "CHECK_OUT");
        checkOut.Should().NotBeNull();
        checkOut!.Status.Should().Be("APPROVED");
        checkOut.CreditEarned.Should().Be(1.0m);

        // Kiểm tra sổ cái VolunteerCreditRecord
        var creditRecordInDb = await context.VolunteerCreditRecords.FirstOrDefaultAsync(c => c.ActivityRegistrationId == regId);
        creditRecordInDb.Should().NotBeNull();
        creditRecordInDb!.CreditDays.Should().Be(1.0m);
        creditRecordInDb.Status.Should().Be(VolunteerCreditRecord.StatusOfficial);
        creditRecordInDb.AwardedBy.Should().Be(userId);
    }

    [Fact]
    public async Task Handle_WhenUnauthorizedOrgAdmin_ShouldThrowUnauthorizedAccessException()
    {
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var regId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();
        var userOrgId = Guid.NewGuid();
        var otherOrgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                OrganizationId = userOrgId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "ORGANIZATION_ADMIN" } } }
            });

        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(userOrgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { userOrgId });

        var campaign = new Campaign
        {
            Id = campaignId,
            OrganizationId = otherOrgId,
            Name = "Chiến dịch Đơn vị Khác",
            Status = "ACTIVE"
        };
        var activity = new Activity
        {
            Id = activityId,
            CampaignId = campaignId,
            Campaign = campaign,
            Name = "Hoạt động Khác",
            Status = "ONGOING"
        };
        var registration = new ActivityRegistration
        {
            Id = regId,
            ActivityId = activityId,
            Activity = activity,
            VolunteerId = Guid.NewGuid(),
            Status = "APPROVED"
        };

        context.Campaigns.Add(campaign);
        context.Activities.Add(activity);
        context.ActivityRegistrations.Add(registration);
        await context.SaveChangesAsync();

        var handler = new ManualMarkAttendanceCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object
        );

        var act = () => handler.Handle(new ManualMarkAttendanceCommand(regId, "CHECK_IN"), CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Bạn không có quyền điểm danh cho hoạt động này*");
    }
}
