using FluentAssertions;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Domain;

public class VolunteerCreditRecordDomainTests
{
    [Fact]
    public void CreateForActivityCompletion_ShouldInitializeCorrectProperties()
    {
        var volunteerId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var regId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var record = VolunteerCreditRecord.CreateForActivityCompletion(
            volunteerId: volunteerId,
            activityId: activityId,
            registrationId: regId,
            creditDays: 1.5m,
            awardedAt: now,
            activityName: "Chiến dịch Hoa phượng đỏ"
        );

        record.Id.Should().NotBeEmpty();
        record.VolunteerId.Should().Be(volunteerId);
        record.ActivityId.Should().Be(activityId);
        record.ActivityRegistrationId.Should().Be(regId);
        record.CreditDays.Should().Be(1.5m);
        record.RecordType.Should().Be(VolunteerCreditRecord.RecordTypeActivityCompletion);
        record.Status.Should().Be(VolunteerCreditRecord.StatusOfficial);
        record.AwardedBy.Should().BeNull();
        record.Reason.Should().Contain("Chiến dịch Hoa phượng đỏ");
        record.AwardedAt.Should().Be(now);
    }

    [Fact]
    public void CreateManual_ShouldInitializeCorrectManualProperties()
    {
        var volunteerId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;

        var record = VolunteerCreditRecord.CreateManual(
            volunteerId: volunteerId,
            creditDays: 2.0m,
            recordType: VolunteerCreditRecord.RecordTypeBloodDonation,
            reason: "Hiến máu tình nguyện đợt 1 năm 2026",
            awardedBy: adminId,
            awardedAt: now
        );

        record.Id.Should().NotBeEmpty();
        record.VolunteerId.Should().Be(volunteerId);
        record.ActivityId.Should().BeNull();
        record.ActivityRegistrationId.Should().BeNull();
        record.CreditDays.Should().Be(2.0m);
        record.RecordType.Should().Be(VolunteerCreditRecord.RecordTypeBloodDonation);
        record.Status.Should().Be(VolunteerCreditRecord.StatusOfficial);
        record.AwardedBy.Should().Be(adminId);
        record.Reason.Should().Be("Hiến máu tình nguyện đợt 1 năm 2026");
    }

    [Fact]
    public void Revoke_ShouldChangeStatusAndAppendReason()
    {
        var record = VolunteerCreditRecord.CreateManual(
            volunteerId: Guid.NewGuid(),
            creditDays: 1.0m,
            recordType: VolunteerCreditRecord.RecordTypeManualAward,
            reason: "Khen thưởng hoàn thành xuất sắc",
            awardedBy: Guid.NewGuid(),
            awardedAt: DateTimeOffset.UtcNow
        );

        record.Revoke("Phát hiện trùng lặp hồ sơ");

        record.Status.Should().Be(VolunteerCreditRecord.StatusRevoked);
        record.Reason.Should().Contain("Đã thu hồi: Phát hiện trùng lặp hồ sơ");
    }
}
