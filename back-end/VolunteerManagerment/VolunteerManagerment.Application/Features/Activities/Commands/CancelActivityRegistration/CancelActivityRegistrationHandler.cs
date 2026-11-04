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

        registration.Cancel(activity.StartTime, DateTimeOffset.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}
