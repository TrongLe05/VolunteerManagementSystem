using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Campaigns.Commands.DeleteCampaign;
using VolunteerManagerment.Application.Features.Campaigns.Commands.UpdateCampaign;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Campaigns;

public class UpdateAndDeleteCampaignHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<ICampaignRepository> _campaignRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    [Fact]
    public async Task UpdateCampaign_WhenSuperAdmin_ShouldUpdateFieldsAndSave()
    {
        var userId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();
        var campaign = new Campaign
        {
            Id = campaignId,
            Name = "Tên cũ",
            Status = "DRAFT"
        };

        _campaignRepositoryMock.Setup(r => r.GetByIdAsync(campaignId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(campaign);
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        var handler = new UpdateCampaignCommandHandler(
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _campaignRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new UpdateCampaignCommand(
            campaignId,
            "  Chiến dịch Mùa Hè Xanh Mới  ",
            "  Mô tả mới  ",
            new DateOnly(2026, 6, 1),
            new DateOnly(2026, 8, 31),
            "ACTIVE"
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().BeTrue();
        campaign.Name.Should().Be("Chiến dịch Mùa Hè Xanh Mới");
        campaign.Description.Should().Be("Mô tả mới");
        campaign.Status.Should().Be("ACTIVE");
        _campaignRepositoryMock.Verify(r => r.Update(campaign), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task DeleteCampaign_WhenOrgAdminOfAnotherOrg_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();
        var userOrgId = Guid.NewGuid();
        var otherOrgId = Guid.NewGuid();

        _campaignRepositoryMock.Setup(r => r.GetByIdAsync(campaignId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Campaign { Id = campaignId, OrganizationId = otherOrgId });
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                OrganizationId = userOrgId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "ORGANIZATION_ADMIN" } } }
            });
        _organizationRepositoryMock.Setup(r => r.GetSubOrganizationIdsAsync(userOrgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Guid> { userOrgId });

        var handler = new DeleteCampaignCommandHandler(
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _campaignRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var act = () => handler.Handle(new DeleteCampaignCommand(campaignId), CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Người dùng không có quyền xóa chiến dịch này*");
    }
}
