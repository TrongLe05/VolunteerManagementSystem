using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Activities.Commands.RegisterActivity;

public class RegisterActivityCommandHandler(
    ICurrentUserService currentUserService,
    IActivityRepository activityRepository,
    IVolunteerRepository volunteerRepository,
    IActivityRegistrationRepository activityRegistrationRepository,
    IOrganizationRepository organizationRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<RegisterActivityCommand, Guid>
{
    public async Task<Guid> Handle(RegisterActivityCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var volunteer = await volunteerRepository.GetByUserIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Tài khoản chưa có hồ sơ tình nguyện viên hợp lệ.");

        if (!volunteer.IsActive)
            throw new UnauthorizedAccessException("Hồ sơ tình nguyện viên của bạn đang bị khoá");

        var activity = await activityRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy hoạt động.");

        if (activity.Status != "OPEN")
            throw new InvalidOperationException("Hoạt động hiện không mở đăng ký.");

        if (DateTimeOffset.UtcNow > activity.EndTime)
            throw new InvalidOperationException("Hoạt động đã kết thúc, không thể đăng ký.");

        var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(activity.Campaign.OrganizationId, cancellationToken);

        if (!allowedOrgs.Contains(volunteer.OrganizationId))
            throw new UnauthorizedAccessException("Bạn không có quyền đăng ký hoạt động này.");


        var exitingRegistration = await activityRegistrationRepository.GetByActivityAndVolunteerAsync(activity.Id, volunteer.Id, cancellationToken);
        if (exitingRegistration != null)
        {
            if (exitingRegistration.Status is "REGISTERED" or "APPROVED")
                throw new InvalidOperationException("Bạn đã đăng ký hoạt động này rồi.");

            if (exitingRegistration.Status is "REJECTED")
                throw new InvalidOperationException("Đơn đăng ký của bạn cho hoạt động này đã bị từ chối đăng ký hoạt động này.");
        }

        int capacity = 0;
        if (activity.Capacity.HasValue)
        {
            capacity = await activityRegistrationRepository.CountActivityRegistrationsAsync(activity.Id, cancellationToken);
            if (capacity >= activity.Capacity.Value)
                throw new InvalidOperationException("Hoạt động đã đạt giới hạn số lượng đăng ký.");
        }

        if (exitingRegistration is { Status: "CANCELLED" })
        {
            exitingRegistration.Status = "REGISTERED";
            exitingRegistration.RegisteredAt = DateTimeOffset.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return exitingRegistration.Id;
        }

        var newRegister = new ActivityRegistration
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            VolunteerId = volunteer.Id,
            Status = "REGISTERED",
            RegisteredAt = DateTimeOffset.UtcNow,
        };

        await activityRegistrationRepository.AddAsync(newRegister, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return newRegister.Id;
    }
}
