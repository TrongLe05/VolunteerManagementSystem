using FluentAssertions;
using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Domain.ValueObjects;
using Xunit;

namespace VolunteerManagerment.Tests.Domain;

public class AttendanceDomainTests
{
    [Fact]
    public void NewAttendance_ShouldHaveExpectedDatabaseConstraintDefaultValues()
    {
        var attendance = new Attendance();

        attendance.Should().BeAssignableTo<BaseEntity>();
        attendance.Id.Should().NotBeEmpty();
        attendance.LocationStatus.Should().Be("PENDING_REVIEW");
        attendance.VerificationMethod.Should().Be("FACE_RECOGNITION");
        attendance.Status.Should().Be("PENDING");
        attendance.IsLivenessVerified.Should().BeFalse();
        attendance.CreditEarned.Should().Be(0.0m);
    }

    [Fact]
    public void CreateGeofenceFaceCheckIn_WhenInsideAndOutsideGeofence_ShouldSetCorrectStatusesAndRetention()
    {
        var now = DateTimeOffset.UtcNow;
        var coord = new GpsCoordinate(10.4602m, 105.6426m);

        var insideAttendance = Attendance.CreateGeofenceFaceCheckIn(
            sessionId: Guid.NewGuid(),
            registrationId: Guid.NewGuid(),
            coordinate: coord,
            accuracyMeters: 10m,
            isInsideGeofence: true,
            distanceMeters: 25m,
            allowedRadiusMeters: 150m,
            activityCreditHours: 4.5m,
            capturedImageUrl: "https://storage/checkin.jpg",
            attendedAt: now
        );

        insideAttendance.Status.Should().Be("APPROVED");
        insideAttendance.LocationStatus.Should().Be("VALID");
        insideAttendance.VerificationMethod.Should().Be("FACE_RECOGNITION");
        insideAttendance.CreditEarned.Should().Be(4.5m);
        insideAttendance.ImageExpiresAt.Should().Be(now.AddDays(Attendance.DefaultImageRetentionDays));

        var outsideAttendance = Attendance.CreateGeofenceFaceCheckIn(
            sessionId: Guid.NewGuid(),
            registrationId: Guid.NewGuid(),
            coordinate: coord,
            accuracyMeters: 15m,
            isInsideGeofence: false,
            distanceMeters: 420m,
            allowedRadiusMeters: 150m,
            activityCreditHours: 4.5m,
            capturedImageUrl: "https://storage/checkin_out.jpg",
            attendedAt: now
        );

        outsideAttendance.Status.Should().Be("PENDING");
        outsideAttendance.LocationStatus.Should().Be("INVALID");
        outsideAttendance.CreditEarned.Should().Be(0m);
        outsideAttendance.Note.Should().Contain("Ngoài vùng điểm danh");
    }

    [Fact]
    public void CreateManualAndApproveManually_ShouldHandleCustomAndDefaultNotes()
    {
        var now = DateTimeOffset.UtcNow;
        var reviewerId = Guid.NewGuid();

        var manualWithDefaultNote = Attendance.CreateManual(
            sessionId: Guid.NewGuid(),
            registrationId: Guid.NewGuid(),
            creditHours: 3.0m,
            reviewerId: reviewerId,
            attendedAt: now,
            note: null
        );

        manualWithDefaultNote.Status.Should().Be("APPROVED");
        manualWithDefaultNote.LocationStatus.Should().Be("VALID");
        manualWithDefaultNote.VerificationMethod.Should().Be("MANUAL");
        manualWithDefaultNote.CreditEarned.Should().Be(3.0m);
        manualWithDefaultNote.ReviewedBy.Should().Be(reviewerId);
        manualWithDefaultNote.Note.Should().Be("Cán bộ điểm danh thủ công tại hiện trường");

        // Duyệt thủ công một lượt điểm danh đang PENDING (ngoài vùng)
        var pendingAttendance = new Attendance
        {
            Status = "PENDING",
            LocationStatus = "INVALID",
            VerificationMethod = "FACE_RECOGNITION"
        };

        pendingAttendance.ApproveManually(reviewerId, now, null);
        pendingAttendance.Status.Should().Be("APPROVED");
        pendingAttendance.LocationStatus.Should().Be("VALID");
        pendingAttendance.VerificationMethod.Should().Be("MANUAL");
        pendingAttendance.ReviewedBy.Should().Be(reviewerId);
        pendingAttendance.Note.Should().Be("Cán bộ cập nhật điểm danh thủ công tại hiện trường");
    }

    [Fact]
    public void AttendanceSession_IsActiveAtAndClose_ShouldEnforceSessionLifecycle()
    {
        var now = DateTimeOffset.UtcNow;

        // Phiên không giới hạn thời gian kết thúc (EndedAt = null) -> luôn Active
        var openEndedSession = new AttendanceSession
        {
            ActivityId = Guid.NewGuid(),
            Type = "CHECK_IN",
            StartedAt = now.AddMinutes(-5),
            EndedAt = null
        };
        openEndedSession.IsActiveAt(now.AddHours(5)).Should().BeTrue();

        // Đóng phiên -> EndedAt được gán và không còn Active sau thời điểm đóng
        openEndedSession.Close(now);
        openEndedSession.EndedAt.Should().Be(now);
        openEndedSession.IsActiveAt(now.AddSeconds(1)).Should().BeFalse();
    }
}
