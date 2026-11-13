using MediatR;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Domain.ValueObjects;

namespace VolunteerManagerment.Application.Features.Attendances.Commands.CheckIn;

public class CheckInCommandHandler(
    IApplicationDbContext context,
    ICurrentUserService currentUserService,
    ISupabaseStorageService? storageService = null
) : IRequestHandler<CheckInCommand, CheckInResultDto>
{
    public async Task<CheckInResultDto> Handle(CheckInCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        // 1. Tìm thông tin tình nguyện viên
        var volunteer = await context.Volunteers
            .FirstOrDefaultAsync(v => v.UserId == userId, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy thông tin tình nguyện viên cho tài khoản này.");

        // 2. Tìm bản ghi đăng ký hoạt động & kiểm tra quy tắc Domain
        var registration = await context.ActivityRegistrations
            .Include(ar => ar.Activity)
                .ThenInclude(a => a.Locations)
            .FirstOrDefaultAsync(ar => ar.ActivityId == request.ActivityId && ar.VolunteerId == volunteer.Id, cancellationToken)
            ?? throw new InvalidOperationException("Bạn chưa đăng ký tham gia hoạt động này.");

        registration.EnsureEligibleForCheckIn();

        // 3. Kiểm tra xem hoạt động có phiên điểm danh nào đang mở không
        var now = DateTimeOffset.UtcNow;
        var activeSession = await context.AttendanceSessions
            .Where(s => s.ActivityId == request.ActivityId && (s.EndedAt == null || s.EndedAt > now))
            .OrderByDescending(s => s.StartedAt)
            .FirstOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Hiện tại chưa có phiên điểm danh nào đang mở hoặc phiên đã kết thúc.");

        // 4. Kiểm tra xem tình nguyện viên đã điểm danh trong phiên này chưa
        var existingAttendance = await context.Attendances
            .FirstOrDefaultAsync(a => a.AttendanceSessionId == activeSession.Id && a.ActivityRegistrationId == registration.Id, cancellationToken);

        if (existingAttendance != null)
        {
            throw new InvalidOperationException($"Bạn đã hoàn thành điểm danh phiên {activeSession.Type} lúc {existingAttendance.AttendedAt:HH:mm}.");
        }

        // 5. Kiểm tra GPS Geofencing thông qua ValueObject GpsCoordinate và Domain Entity Activity
        var volunteerCoordinate = new GpsCoordinate(request.Latitude, request.Longitude);
        var (minDistance, allowedRadius, isInside) = registration.Activity.EvaluateGeofence(volunteerCoordinate);

        // 6. Xử lý ảnh chụp selfie bằng chứng (nếu có base64)
        string? capturedPhotoUrl = null;
        if (!string.IsNullOrWhiteSpace(request.CapturedImageBase64))
        {
            try
            {
                var cleanBase64 = request.CapturedImageBase64;
                if (cleanBase64.Contains(','))
                {
                    cleanBase64 = cleanBase64.Substring(cleanBase64.IndexOf(',') + 1);
                }

                var imageBytes = Convert.FromBase64String(cleanBase64);
                if (storageService != null && imageBytes.Length > 0)
                {
                    using var stream = new MemoryStream(imageBytes);
                    var fileName = $"attendance_{activeSession.Id}_{volunteer.Id}_{now.ToUnixTimeSeconds()}.jpg";
                    capturedPhotoUrl = await storageService.UploadFileAsync(stream, fileName, "image/jpeg", cancellationToken);
                }
            }
            catch
            {
                capturedPhotoUrl = null;
            }
        }

        // 7. Xác định ngày công ghi nhận: Chỉ công nhận khi là phiên CHECK_OUT và đã có lượt CHECK_IN hợp lệ (APPROVED)
        var isCheckOut = string.Equals(activeSession.Type, "CHECK_OUT", StringComparison.OrdinalIgnoreCase);
        var hasApprovedCheckIn = false;
        if (isCheckOut)
        {
            hasApprovedCheckIn = await context.Attendances
                .AnyAsync(a => a.ActivityRegistrationId == registration.Id
                            && a.AttendanceSession.Type == "CHECK_IN"
                            && a.Status == "APPROVED", cancellationToken);
        }

        var creditDaysToAward = (isCheckOut && hasApprovedCheckIn)
            ? registration.Activity.CreditDays
            : 0m;

        // 8. Khởi tạo Attendance qua Domain Factory Method
        var attendance = Attendance.CreateGeofenceFaceCheckIn(
            sessionId: activeSession.Id,
            registrationId: registration.Id,
            coordinate: volunteerCoordinate,
            accuracyMeters: request.LocationAccuracyMeters,
            isInsideGeofence: isInside,
            distanceMeters: minDistance,
            allowedRadiusMeters: allowedRadius,
            activityCreditDays: creditDaysToAward,
            capturedImageUrl: capturedPhotoUrl,
            attendedAt: now
        );

        context.Attendances.Add(attendance);

        // 9. Tự động ghi vào Sổ cái ngày công (VolunteerCreditRecord) khi hoàn tất đủ 2/2 lượt
        if (isCheckOut && isInside && hasApprovedCheckIn && registration.Activity.CreditDays > 0m)
        {
            var alreadyCredited = await context.VolunteerCreditRecords
                .AnyAsync(c => c.ActivityRegistrationId == registration.Id
                            && c.Status == VolunteerCreditRecord.StatusOfficial, cancellationToken);

            if (!alreadyCredited)
            {
                var creditRecord = VolunteerCreditRecord.CreateForActivityCompletion(
                    volunteerId: volunteer.Id,
                    activityId: registration.ActivityId,
                    registrationId: registration.Id,
                    creditDays: registration.Activity.CreditDays,
                    awardedAt: now,
                    activityName: registration.Activity.Name
                );
                context.VolunteerCreditRecords.Add(creditRecord);
            }
        }

        await context.SaveChangesAsync(cancellationToken);

        var msg = isInside
            ? $"Điểm danh {activeSession.Type} thành công! (Khoảng cách {minDistance:F0}m)"
            : $"Đã ghi nhận điểm danh {activeSession.Type}, nhưng tọa độ cách hiện trường {minDistance:F0}m (vượt bán kính {allowedRadius:F0}m). Cán bộ sẽ kiểm tra lại.";

        return new CheckInResultDto(
            Success: true,
            Message: msg,
            SessionType: activeSession.Type,
            AttendedAt: attendance.AttendedAt,
            LocationStatus: attendance.LocationStatus,
            DistanceMeters: Math.Round(minDistance, 1),
            IsInsideGeofence: isInside
        );
    }
}
