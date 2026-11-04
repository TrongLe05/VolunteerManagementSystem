using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Features.Attendances.Commands.CheckIn;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Attendances;

public class CheckInCommandHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<ISupabaseStorageService> _storageServiceMock = new();

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenVolunteerInsideGeofence_ShouldSucceedWithApprovedStatus()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var org = new Organization { Id = Guid.NewGuid(), Name = "Đoàn trường ĐH Đồng Tháp" };
        var volunteer = new Volunteer
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FullName = "Nguyễn Văn A",
            OrganizationId = org.Id,
            ConsentFaceAuth = true
        };
        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            Name = "Chiến dịch Mùa hè xanh 2026",
            CreditHours = 4.0m,
            StartTime = DateTimeOffset.UtcNow.AddHours(-1),
            EndTime = DateTimeOffset.UtcNow.AddHours(3),
            Status = "ONGOING",
            Locations = new List<ActivityLocation>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "Cổng chính DThU",
                    Latitude = 10.4550000m,
                    Longitude = 105.6320000m,
                    AllowedRadiusMeters = 150m
                }
            }
        };
        var registration = new ActivityRegistration
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            VolunteerId = volunteer.Id,
            Status = "APPROVED",
            Activity = activity
        };
        var session = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            Type = "CHECK_IN",
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-2),
            EndedAt = DateTimeOffset.UtcNow.AddMinutes(3)
        };

        context.Organizations.Add(org);
        context.Volunteers.Add(volunteer);
        context.Activities.Add(activity);
        context.ActivityRegistrations.Add(registration);
        context.AttendanceSessions.Add(session);
        await context.SaveChangesAsync();

        var handler = new CheckInCommandHandler(context, _currentUserServiceMock.Object, _storageServiceMock.Object);

        // Act: GPS tọa độ cách cổng chính ~ 50 mét
        var command = new CheckInCommand(
            ActivityId: activity.Id,
            Latitude: 10.4553000m,
            Longitude: 105.6322000m,
            LocationAccuracyMeters: 5m,
            CapturedImageBase64: null
        );

        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.Success.Should().BeTrue();
        result.IsInsideGeofence.Should().BeTrue();
        result.LocationStatus.Should().Be("VALID");

        var recordInDb = await context.Attendances.FirstOrDefaultAsync(a => a.AttendanceSessionId == session.Id);
        recordInDb.Should().NotBeNull();
        recordInDb!.Status.Should().Be("APPROVED");
        recordInDb.LocationStatus.Should().Be("VALID");
        recordInDb.VerificationMethod.Should().Be("FACE_RECOGNITION");
        recordInDb.CreditEarned.Should().Be(4.0m);
    }

    [Fact]
    public async Task Handle_WhenVolunteerOutsideGeofence_ShouldSucceedWithPendingAndInvalidLocationStatus()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var volunteer = new Volunteer { Id = Guid.NewGuid(), UserId = userId, FullName = "Trần Thị B" };
        var activity = new Activity
        {
            Id = Guid.NewGuid(),
            Name = "Tiếp sức mùa thi DThU",
            CreditHours = 2.0m,
            StartTime = DateTimeOffset.UtcNow.AddHours(-1),
            EndTime = DateTimeOffset.UtcNow.AddHours(2),
            Status = "ONGOING",
            Locations = new List<ActivityLocation>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "Nhà thi đấu DThU",
                    Latitude = 10.4550000m,
                    Longitude = 105.6320000m,
                    AllowedRadiusMeters = 100m
                }
            }
        };
        var registration = new ActivityRegistration
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            VolunteerId = volunteer.Id,
            Status = "REGISTERED",
            Activity = activity
        };
        var session = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            Type = "CHECK_IN",
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-1),
            EndedAt = DateTimeOffset.UtcNow.AddMinutes(4)
        };

        context.Volunteers.Add(volunteer);
        context.Activities.Add(activity);
        context.ActivityRegistrations.Add(registration);
        context.AttendanceSessions.Add(session);
        await context.SaveChangesAsync();

        var handler = new CheckInCommandHandler(context, _currentUserServiceMock.Object, _storageServiceMock.Object);

        // Act: GPS tọa độ cách điểm tập kết ~ 1000m (ngoài vùng)
        var command = new CheckInCommand(
            ActivityId: activity.Id,
            Latitude: 10.4650000m,
            Longitude: 105.6420000m,
            LocationAccuracyMeters: 10m,
            CapturedImageBase64: null
        );

        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Success.Should().BeTrue();
        result.IsInsideGeofence.Should().BeFalse();
        result.LocationStatus.Should().Be("INVALID");

        var recordInDb = await context.Attendances.FirstOrDefaultAsync(a => a.AttendanceSessionId == session.Id);
        recordInDb.Should().NotBeNull();
        recordInDb!.Status.Should().Be("PENDING");
        recordInDb.LocationStatus.Should().Be("INVALID");
        recordInDb.CreditEarned.Should().Be(0m);
    }

    [Fact]
    public async Task Handle_WhenDuplicateCheckIn_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var volunteer = new Volunteer { Id = Guid.NewGuid(), UserId = userId, FullName = "Lê Văn C" };
        var activity = new Activity { Id = Guid.NewGuid(), Name = "Hoạt động bảo vệ môi trường" };
        var registration = new ActivityRegistration
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            VolunteerId = volunteer.Id,
            Status = "APPROVED",
            Activity = activity
        };
        var session = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            Type = "CHECK_IN",
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-1),
            EndedAt = DateTimeOffset.UtcNow.AddMinutes(4)
        };
        var pastAttendance = new Attendance
        {
            Id = Guid.NewGuid(),
            AttendanceSessionId = session.Id,
            ActivityRegistrationId = registration.Id,
            AttendedAt = DateTimeOffset.UtcNow.AddMinutes(-1),
            Status = "APPROVED"
        };

        context.Volunteers.Add(volunteer);
        context.Activities.Add(activity);
        context.ActivityRegistrations.Add(registration);
        context.AttendanceSessions.Add(session);
        context.Attendances.Add(pastAttendance);
        await context.SaveChangesAsync();

        var handler = new CheckInCommandHandler(context, _currentUserServiceMock.Object, _storageServiceMock.Object);

        var command = new CheckInCommand(
            ActivityId: activity.Id,
            Latitude: 10.4550000m,
            Longitude: 105.6320000m,
            LocationAccuracyMeters: 5m,
            CapturedImageBase64: null
        );

        // Act & Assert
        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*đã hoàn thành điểm danh*");
    }

    [Fact]
    public async Task Handle_WhenNoActiveSession_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var volunteer = new Volunteer { Id = Guid.NewGuid(), UserId = userId, FullName = "Lê Văn D" };
        var activity = new Activity { Id = Guid.NewGuid(), Name = "Hoạt động chưa mở điểm danh" };
        var registration = new ActivityRegistration
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            VolunteerId = volunteer.Id,
            Status = "APPROVED",
            Activity = activity
        };
        // Phiên đã kết thúc 10 phút trước
        var expiredSession = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            Type = "CHECK_IN",
            StartedAt = DateTimeOffset.UtcNow.AddMinutes(-15),
            EndedAt = DateTimeOffset.UtcNow.AddMinutes(-10)
        };

        context.Volunteers.Add(volunteer);
        context.Activities.Add(activity);
        context.ActivityRegistrations.Add(registration);
        context.AttendanceSessions.Add(expiredSession);
        await context.SaveChangesAsync();

        var handler = new CheckInCommandHandler(context, _currentUserServiceMock.Object, _storageServiceMock.Object);

        var command = new CheckInCommand(activity.Id, 10.455m, 105.632m, 5m, null);

        // Act & Assert
        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*chưa có phiên điểm danh nào đang mở*");
    }

    [Fact]
    public async Task Handle_WhenVolunteerNotRegistered_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var volunteer = new Volunteer { Id = Guid.NewGuid(), UserId = userId, FullName = "Phạm Văn E" };
        var activity = new Activity { Id = Guid.NewGuid(), Name = "Hoạt động chưa đăng ký" };
        var session = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            Type = "CHECK_IN",
            StartedAt = DateTimeOffset.UtcNow,
            EndedAt = DateTimeOffset.UtcNow.AddMinutes(5)
        };

        context.Volunteers.Add(volunteer);
        context.Activities.Add(activity);
        context.AttendanceSessions.Add(session);
        await context.SaveChangesAsync();

        var handler = new CheckInCommandHandler(context, _currentUserServiceMock.Object, _storageServiceMock.Object);

        var command = new CheckInCommand(activity.Id, 10.455m, 105.632m, 5m, null);

        // Act & Assert
        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Bạn chưa đăng ký tham gia hoạt động này.*");
    }
}
