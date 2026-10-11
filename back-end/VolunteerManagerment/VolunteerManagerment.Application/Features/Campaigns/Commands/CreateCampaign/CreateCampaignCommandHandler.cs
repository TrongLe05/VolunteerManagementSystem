using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Campaigns.DTOs;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Campaigns.Commands.CreateCampaign;

public class CreateCampaignCommandHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    IOrganizationRepository organizationRepository,
    ICampaignRepository campaignRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<CreateCampaignCommand, Guid>
{
    public async Task<Guid> Handle(CreateCampaignCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");
        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken) 
            ?? throw new UnauthorizedAccessException("Người dùng không tồn tại.");

        var roles = user.UserRoles.Select(r => r.Role.Code).ToList();

        if (roles.Contains("ORGANIZATION_ADMIN"))
        {
            var allowedOrgs = await organizationRepository.GetSubOrganizationIdsAsync(user.OrganizationId, cancellationToken);
            if(!allowedOrgs.Contains(request.OrganizationId))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền tạo chiến dịch cho tổ chức này.");
            }
        }
        else if (!roles.Contains("SUPER_ADMIN"))
        {
            throw new UnauthorizedAccessException("Bạn không có quyền tạo chiến dịch.");
        }

        var existingOrgs = await organizationRepository.GetByIdAsync(request.OrganizationId, cancellationToken) ?? throw new KeyNotFoundException("Tổ chức không tồn tại.");

        var newCampaign = new Campaign
        {
            Id = Guid.NewGuid(),
            OrganizationId = request.OrganizationId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Status = "DRAFT",
            CreatedBy = userId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        await campaignRepository.AddAsync(newCampaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return newCampaign.Id;
    }
}
