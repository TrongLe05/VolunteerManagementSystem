using FluentAssertions;
using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Domain.Exceptions;
using VolunteerManagerment.Domain.ValueObjects;
using Xunit;

namespace VolunteerManagerment.Tests.Domain;

public class ActivityAndCampaignDomainTests
{
    [Fact]
    public void Campaign_ValidateDateRangeAndChangeStatus_ShouldEnforceBusinessInvariants()
    {
        var now = DateTimeOffset.UtcNow;
        var campaign = new Campaign
        {
            Name = "Chiến dịch Mùa Hè Xanh 2026",
            StartDate = new DateOnly(2026, 6, 1),
            EndDate = new DateOnly(2026, 8, 31)
        };

        campaign.Should().BeAssignableTo<BaseEntity>();
        campaign.Status.Should().Be("DRAFT");
        campaign.Invoking(c => c.ValidateDateRange()).Should().NotThrow();

        // Ngày kết thúc nhỏ hơn ngày bắt đầu -> ném DomainException
        var invalidCampaign = new Campaign
        {
            StartDate = new DateOnly(2026, 8, 1),
            EndDate = new DateOnly(2026, 7, 1)
        };
        invalidCampaign.Invoking(c => c.ValidateDateRange())
            .Should().Throw<DomainException>()
            .WithMessage("*Ngày kết thúc chiến dịch không được nhỏ hơn ngày bắt đầu*");

        // Chuyển trạng thái hợp lệ
        campaign.ChangeStatus("active", now);
        campaign.Status.Should().Be("ACTIVE");
        campaign.UpdatedAt.Should().Be(now);

        // Trạng thái không tồn tại -> ném DomainException
        campaign.Invoking(c => c.ChangeStatus("UNKNOWN_STATE", now))
            .Should().Throw<DomainException>()
            .WithMessage("*không hợp lệ*");

        // Chiến dịch đã CANCELLED thì không được đổi trạng thái nữa
        campaign.ChangeStatus("CANCELLED", now);
        campaign.Invoking(c => c.ChangeStatus("ACTIVE", now))
            .Should().Throw<DomainException>()
            .WithMessage("*Không thể thay đổi trạng thái của chiến dịch đã bị huỷ*");
    }

    [Fact]
    public void Activity_EnsureOpenForRegistrationAndCapacity_ShouldEnforceRegistrationRules()
    {
        var now = DateTimeOffset.UtcNow;
        var activity = new Activity
        {
            Status = "OPEN",
            EndTime = now.AddHours(5),
            Capacity = 30
        };

        activity.Invoking(a => a.EnsureOpenForRegistration(now)).Should().NotThrow();
        activity.Invoking(a => a.EnsureCapacityAvailable(29)).Should().NotThrow();

        // Đạt giới hạn số lượng -> ném DomainException
        activity.Invoking(a => a.EnsureCapacityAvailable(30))
            .Should().Throw<DomainException>()
            .WithMessage("*đạt giới hạn số lượng đăng ký*");

        // Không giới hạn số lượng (Capacity = null) -> luôn cho phép
        activity.Capacity = null;
        activity.Invoking(a => a.EnsureCapacityAvailable(1000)).Should().NotThrow();

        // Quá hạn kết thúc hoạt động -> ném DomainException
        activity.Invoking(a => a.EnsureOpenForRegistration(now.AddHours(6)))
            .Should().Throw<DomainException>()
            .WithMessage("*Hoạt động đã kết thúc, không thể đăng ký*");

        // Trạng thái không phải OPEN -> ném DomainException
        activity.Status = "DRAFT";
        activity.Invoking(a => a.EnsureOpenForRegistration(now))
            .Should().Throw<DomainException>()
            .WithMessage("*Hoạt động hiện không mở đăng ký*");
    }

    [Fact]
    public void Activity_EvaluateGeofence_ShouldHandleEmptySingleAndMultipleLocations()
    {
        var volunteerCoord = new GpsCoordinate(10.4603000m, 105.6426000m);

        // 1. Hoạt động chưa cấu hình địa điểm -> mặc định hợp lệ (0m, 150m, true)
        var activityNoLoc = new Activity { Locations = [] };
        activityNoLoc.EvaluateGeofence(volunteerCoord).Should().Be((0m, 150m, true));

        // 2. Hoạt động có nhiều cổng điểm danh -> tự động chọn cổng gần nhất
        var farLocation = new ActivityLocation
        {
            Name = "Cơ sở 2",
            Latitude = 10.5000000m,
            Longitude = 105.7000000m,
            AllowedRadiusMeters = 200m
        };
        var nearLocationWithZeroRadius = new ActivityLocation
        {
            Name = "Cổng A ĐH Đồng Tháp",
            Latitude = 10.4602000m,
            Longitude = 105.6426000m,
            AllowedRadiusMeters = 0m // Sẽ fallback về DefaultAllowedRadiusMeters = 150m
        };

        nearLocationWithZeroRadius.IsWithinGeofence(volunteerCoord).Should().BeTrue();

        var activityMultiLoc = new Activity
        {
            Locations = [farLocation, nearLocationWithZeroRadius]
        };

        var (minDist, radius, isInside) = activityMultiLoc.EvaluateGeofence(volunteerCoord);
        isInside.Should().BeTrue();
        radius.Should().Be(150m);
        minDist.Should().BeLessThan(30m);
    }

    [Fact]
    public void Activity_EnsureCanOpenAttendanceSessionAndTransition_ShouldHandleAllStatuses()
    {
        var now = DateTimeOffset.UtcNow;
        var openActivity = new Activity { Status = "OPEN" };

        openActivity.EnsureCanOpenAttendanceSessionAndTransition(now);
        openActivity.Status.Should().Be("ONGOING");
        openActivity.UpdatedAt.Should().Be(now);

        // Khi đã ONGOING thì vẫn cho phép mở phiên tiếp theo (ví dụ mở CHECK_OUT)
        openActivity.Invoking(a => a.EnsureCanOpenAttendanceSessionAndTransition(now.AddHours(1)))
            .Should().NotThrow();

        var completedActivity = new Activity { Status = "COMPLETED" };
        completedActivity.Invoking(a => a.EnsureCanOpenAttendanceSessionAndTransition(now))
            .Should().Throw<DomainException>()
            .WithMessage("*đang mở hoặc đang diễn ra*");
    }

    [Fact]
    public void ActivityRegistration_AllLifecycleMethods_ShouldEnforceDomainRules()
    {
        var now = DateTimeOffset.UtcNow;
        var registration = new ActivityRegistration { Status = "REGISTERED" };

        // 1. Đang REGISTERED thì không thể đăng ký trùng hoặc kích hoạt lại
        registration.Invoking(r => r.EnsureCanRegisterAgain())
            .Should().Throw<DomainException>().WithMessage("*Bạn đã đăng ký hoạt động này rồi*");
        registration.Invoking(r => r.Reactivate(now))
            .Should().Throw<DomainException>().WithMessage("*Chỉ có thể kích hoạt lại đơn đăng ký đã huỷ*");
        registration.Invoking(r => r.EnsureEligibleForCheckIn()).Should().NotThrow();

        // 2. Không thể huỷ khi hoạt động đã bắt đầu
        registration.Invoking(r => r.Cancel(now.AddMinutes(-5), now))
            .Should().Throw<DomainException>().WithMessage("*hoạt động đã bắt đầu hoặc đã kết thúc*");

        // 3. Huỷ hợp lệ trước giờ bắt đầu
        registration.Cancel(now.AddHours(2), now);
        registration.Status.Should().Be("CANCELLED");

        // 4. Đã CANCELLED thì không được huỷ tiếp, không được điểm danh, không được duyệt
        registration.Invoking(r => r.Cancel(now.AddHours(2), now))
            .Should().Throw<DomainException>().WithMessage("*đã huỷ trước đó*");
        registration.Invoking(r => r.EnsureEligibleForCheckIn())
            .Should().Throw<DomainException>().WithMessage("*chưa được duyệt hoặc đã bị hủy*");
        registration.Invoking(r => r.Review("APPROVED", "OPEN", Guid.NewGuid(), now))
            .Should().Throw<DomainException>().WithMessage("*Tình nguyện viên đã huỷ đơn đăng ký này*");

        // 5. Đã CANCELLED thì được phép đăng ký lại (Reactivate)
        registration.Invoking(r => r.EnsureCanRegisterAgain()).Should().NotThrow();
        registration.Reactivate(now);
        registration.Status.Should().Be("REGISTERED");

        // 6. Không thể duyệt đơn khi hoạt động đã COMPLETED
        registration.Invoking(r => r.Review("APPROVED", "COMPLETED", Guid.NewGuid(), now))
            .Should().Throw<DomainException>().WithMessage("*Hoạt động đã kết thúc hoặc bị huỷ*");

        // 7. Từ chối đơn (REJECTED) -> Không được đăng ký lại và không được huỷ
        var reviewerId = Guid.NewGuid();
        registration.Review("REJECTED", "OPEN", reviewerId, now);
        registration.Status.Should().Be("REJECTED");
        registration.ApprovedBy.Should().Be(reviewerId);

        registration.Invoking(r => r.EnsureCanRegisterAgain())
            .Should().Throw<DomainException>().WithMessage("*đã bị từ chối*");
        registration.Invoking(r => r.Cancel(now.AddHours(2), now))
            .Should().Throw<DomainException>().WithMessage("*Đơn đăng ký đã bị từ chối, không thể huỷ*");
    }
}
