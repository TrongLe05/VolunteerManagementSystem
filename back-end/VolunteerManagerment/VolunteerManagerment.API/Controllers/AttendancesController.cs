using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VolunteerManagerment.Application.Features.Attendances.Commands.CheckIn;
using VolunteerManagerment.Application.Features.Attendances.Commands.CloseAttendanceSession;
using VolunteerManagerment.Application.Features.Attendances.Commands.ManualMarkAttendance;
using VolunteerManagerment.Application.Features.Attendances.Commands.OpenAttendanceSession;
using VolunteerManagerment.Application.Features.Attendances.Queries;
using VolunteerManagerment.Application.Features.Attendances.Queries.GetActivityAttendanceOverview;
using VolunteerManagerment.Application.Features.Attendances.Queries.GetAttendanceSessions;
using VolunteerManagerment.Application.Features.Attendances.Queries.GetSessionAttendances;

namespace VolunteerManagerment.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendancesController(
        ISender sender
    ) : ControllerBase
    {
        // Cán bộ mở phiên điểm danh (mặc định DurationMinutes = 5)
        [HttpPost("sessions")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> OpenSession([FromBody] OpenAttendanceSessionCommand command, CancellationToken cancellationToken)
        {
            var sessionId = await sender.Send(command, cancellationToken);
            return Ok(new { sessionId });
        }

        // Lấy danh sách các phiên điểm danh (có phân trang, filter theo ActivityId nếu cần)
        [HttpGet("sessions")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> GetSessions([FromQuery] Guid? activityId, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken cancellationToken = default)
        {
            var result = await sender.Send(new GetAttendanceSessionsQuery(activityId, pageNumber, pageSize), cancellationToken);
            return Ok(result);
        }

        // Đóng phiên điểm danh sớm
        [HttpPost("sessions/{id}/close")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> CloseSession([FromRoute] Guid id, CancellationToken cancellationToken)
        {
            var result = await sender.Send(new CloseAttendanceSessionCommand(id), cancellationToken);
            return Ok(new { success = result });
        }

        // Xem danh sách sinh viên đã điểm danh trong phiên
        [HttpGet("sessions/{id}/attendances")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> GetSessionAttendances([FromRoute] Guid id, CancellationToken cancellationToken)
        {
            var result = await sender.Send(new GetSessionAttendancesQuery(id), cancellationToken);
            return Ok(result);
        }

        // Kiểm tra xem hoạt động có phiên điểm danh nào đang mở không
        [HttpGet("sessions/active/{activityId}")]
        public async Task<IActionResult> GetActiveSession([FromRoute] Guid activityId, CancellationToken cancellationToken)
        {
            var result = await sender.Send(new GetActiveSessionQuery(activityId), cancellationToken);
            return Ok(result);
        }

        // Tổng quan điểm danh của 1 Hoạt động: Số TNV đăng ký, Số TNV đã điểm danh, và danh sách TNV kèm chi tiết điểm danh
        [HttpGet("activities/{activityId}/overview")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> GetActivityAttendanceOverview([FromRoute] Guid activityId, CancellationToken cancellationToken)
        {
            var result = await sender.Send(new GetActivityAttendanceOverviewQuery(activityId), cancellationToken);
            return Ok(result);
        }

        // Cán bộ điểm danh thủ công tại hiện trường cho sinh viên (khi đt hết pin, v.v.)
        [HttpPost("manual-mark")]
        [Authorize(Roles = "SUPER_ADMIN,ORGANIZATION_ADMIN")]
        public async Task<IActionResult> ManualMark([FromBody] ManualMarkAttendanceCommand command, CancellationToken cancellationToken)
        {
            var result = await sender.Send(command, cancellationToken);
            return Ok(new { success = result });
        }

        // Tình nguyện viên gửi GPS và ảnh selfie điểm danh tại hiện trường
        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn([FromBody] CheckInCommand command, CancellationToken cancellationToken)
        {
            var result = await sender.Send(command, cancellationToken);
            return Ok(result);
        }
    }
}
