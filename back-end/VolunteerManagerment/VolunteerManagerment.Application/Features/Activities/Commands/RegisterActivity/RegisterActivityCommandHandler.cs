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

        volunteer.EnsureEligibleForActivityRegistration();

        var activity = await activityRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken)
            ?? throw new KeyNotFoundException("Không tìm thấy hoạt động.");

        var now = DateTimeOffset.UtcNow;
        activity.EnsureOpenForRegistration(now);

        var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(activity.Campaign.OrganizationId, cancellationToken);
        if (!allowedOrgs.Contains(volunteer.OrganizationId))
            throw new UnauthorizedAccessException("Bạn không có quyền đăng ký hoạt động này.");

        var existingRegistration = await activityRegistrationRepository.GetByActivityAndVolunteerAsync(activity.Id, volunteer.Id, cancellationToken);
        existingRegistration?.EnsureCanRegisterAgain();

        if (activity.Capacity.HasValue)
        {
            var currentCount = await activityRegistrationRepository.CountActivityRegistrationsAsync(activity.Id, cancellationToken);
            activity.EnsureCapacityAvailable(currentCount);
        }

        if (existingRegistration is { Status: "CANCELLED" })
        {
            existingRegistration.Reactivate(now);
            await unitOfWork.SaveChangesAsync(cancellationToken);
            return existingRegistration.Id;
        }

        var newRegister = new ActivityRegistration
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            VolunteerId = volunteer.Id,
            Status = "REGISTERED",
            RegisteredAt = now,
        };

        await activityRegistrationRepository.AddAsync(newRegister, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return newRegister.Id;
    }
}
