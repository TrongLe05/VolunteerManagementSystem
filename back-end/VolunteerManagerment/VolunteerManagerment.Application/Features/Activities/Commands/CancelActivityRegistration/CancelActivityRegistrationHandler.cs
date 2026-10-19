using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Activities.Commands.CancelActivityRegistration;

public class CancelActivityRegistrationHandler(
    ICurrentUserService currentUserService,
    IVolunteerRepository volunteerRepository,
    IActivityRepository activityRepository,
    IActivityRegistrationRepository activityRegistrationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CancelActivityRegistrationCommand, bool>
{
    public async Task<bool> Handle(CancelActivityRegistrationCommand request, CancellationToken cancellationToken)
    {
        var activity = await activityRepository.GetByIdAsync(request.ActivityId)
            ?? throw new KeyNotFoundException("Hoạt động không tồn tại.");

        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var volunteer = await volunteerRepository.GetByUserIdAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("Hồ sơ tình nguyện viên chưa được tạo.");

        if (!volunteer.IsActive)
            throw new InvalidOperationException("Hồ sơ tình nguyện viên của bạn đã bị vô hiệu hóa.");

        var registration = await activityRegistrationRepository.GetByActivityAndVolunteerAsync(request.ActivityId, volunteer.Id)
            ?? throw new InvalidOperationException("Bạn chưa đăng ký tham gia hoạt động này.");

        if (registration.Status is "CANCELLED" or null)
        {
            throw new InvalidOperationException("Bạn chưa đăng ký hoạt động này hoặc đã huỷ trước đó.");
        } 
        else if (registration.Status is "REJECTED")
        {
            throw new InvalidOperationException("Đơn đăng ký đã bị từ chối, không thể huỷ.");
        }

        if (DateTimeOffset.UtcNow > activity.StartTime)
            throw new InvalidOperationException("Không thể huỷ đăng ký khi hoạt động đã bắt đầu hoặc đã kết thúc.");

        registration.Status = "CANCELLED";
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
