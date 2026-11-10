using VolunteerManagerment.Domain.Common;
using VolunteerManagerment.Domain.Exceptions;
using VolunteerManagerment.Domain.ValueObjects;

namespace VolunteerManagerment.Domain.Entities;

public class Activity : BaseEntity, IAuditableEntity
{
    public Guid CampaignId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public int? Capacity { get; set; }
    public decimal CreditDays { get; set; }
    public string Status { get; set; } = "DRAFT";
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation properties
    public Campaign Campaign { get; set; } = null!;
    public User Creator { get; set; } = null!;
    public ICollection<ActivityLocation> Locations { get; set; } = [];
    public ICollection<ActivityRegistration> Registrations { get; set; } = [];
    public ICollection<AttendanceSession> AttendanceSessions { get; set; } = [];

    /// <summary>
    /// Quy tắc nghiệp vụ: Kiểm tra hoạt động có đang mở và còn hạn đăng ký hay không.
    /// </summary>
    public void EnsureOpenForRegistration(DateTimeOffset currentTime)
    {
        if (Status != "OPEN")
            throw new DomainException("Hoạt động hiện không mở đăng ký.");

        if (currentTime > EndTime)
            throw new DomainException("Hoạt động đã kết thúc, không thể đăng ký.");
    }

    /// <summary>
    /// Quy tắc nghiệp vụ: Kiểm tra số lượng đăng ký tối đa (Capacity).
    /// </summary>
    public void EnsureCapacityAvailable(int currentRegistrationsCount)
    {
        if (Capacity.HasValue && currentRegistrationsCount >= Capacity.Value)
            throw new DomainException("Hoạt động đã đạt giới hạn số lượng đăng ký.");
    }

    /// <summary>
    /// Quy tắc nghiệp vụ: Kiểm tra và chuyển trạng thái hoạt động sang ONGOING khi mở phiên điểm danh.
    /// Cho phép mở Check-in sớm tối đa 60 phút trước giờ bắt đầu để tập hợp lực lượng.
    /// Chặn mở nếu hoạt động chưa đến khung giờ cho phép hoặc đã kết thúc.
    /// </summary>
    public void EnsureCanOpenAttendanceSessionAndTransition(DateTimeOffset currentTime, string sessionType = "CHECK_IN")
    {
        if (Status is not ("OPEN" or "ONGOING" or "PUBLISHED" or "UPCOMING"))
            throw new DomainException("Chỉ có thể mở phiên điểm danh cho hoạt động đang mở hoặc đang diễn ra.");

        if (EndTime != default && currentTime > EndTime)
            throw new DomainException("Hoạt động đã kết thúc thời gian tổ chức, không thể mở thêm phiên điểm danh.");

        if (StartTime != default)
        {
            var earliestCheckInAllowed = StartTime.AddMinutes(-60);
            if (currentTime < earliestCheckInAllowed)
            {
                var vnTime = StartTime.ToOffset(TimeSpan.FromHours(7));
                throw new DomainException($"Chưa đến thời gian cho phép điểm danh (chỉ được mở sớm tối đa 60 phút trước khi bắt đầu lúc {vnTime:HH:mm dd/MM/yyyy}).");
            }

            if (sessionType == "CHECK_OUT" && currentTime < StartTime)
            {
                var vnTime = StartTime.ToOffset(TimeSpan.FromHours(7));
                throw new DomainException($"Chỉ có thể mở phiên Điểm danh RA (Check-out) khi hoạt động đã chính thức bắt đầu (từ {vnTime:HH:mm dd/MM/yyyy}).");
            }
        }

        if (Status is not "ONGOING")
        {
            Status = "ONGOING";
            UpdatedAt = currentTime;
        }
    }

    /// <summary>
    /// Quy tắc nghiệp vụ: Đánh giá vị trí GPS của tình nguyện viên so với các điểm Geofence của hoạt động.
    /// </summary>
    public (decimal MinDistanceMeters, decimal AllowedRadiusMeters, bool IsInsideGeofence) EvaluateGeofence(GpsCoordinate volunteerCoordinate)
    {
        if (Locations == null || Locations.Count == 0)
            return (0m, ActivityLocation.DefaultAllowedRadiusMeters, true);

        decimal minDistance = decimal.MaxValue;
        decimal allowedRadius = ActivityLocation.DefaultAllowedRadiusMeters;

        foreach (var loc in Locations)
        {
            var dist = loc.CalculateDistanceInMeters(volunteerCoordinate);
            if (dist < minDistance)
            {
                minDistance = dist;
                allowedRadius = loc.AllowedRadiusMeters > 0m
                    ? loc.AllowedRadiusMeters
                    : ActivityLocation.DefaultAllowedRadiusMeters;
            }
        }

        return (minDistance, allowedRadius, minDistance <= allowedRadius);
    }
}
