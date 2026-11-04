using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Campaigns.Commands.CreateCampaign;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Campaigns;

public class CreateCampaignCommandHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<ICampaignRepository> _campaignRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private CreateCampaignCommandHandler CreateHandler() => new(
        _currentUserServiceMock.Object,
        _userRepositoryMock.Object,
        _organizationRepositoryMock.Object,
        _campaignRepositoryMock.Object,
        _unitOfWorkMock.Object
    );

    [Fact]
    public async Task Handle_WhenSuperAdminCreatesCampaign_ShouldCreateDraftCampaign()
    {
        var userId = Guid.NewGuid();
        var orgId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        _organizationRepositoryMock.Setup(r => r.GetByIdAsync(orgId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Organization { Id = orgId, Name = "Đoàn Trường" });

        var handler = CreateHandler();
        var command = new CreateCampaignCommand(
            orgId,
            "Chiến dịch Mùa Hè Xanh 2026",
            "Chiến dịch tình nguyện hè",
            new DateOnly(2026, 6, 1),
            new DateOnly(2026, 8, 31)
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().NotBeEmpty();
        _campaignRepositoryMock.Verify(r => r.AddAsync(It.Is<Campaign>(c =>
            c.OrganizationId == orgId &&
            c.Name == "Chiến dịch Mùa Hè Xanh 2026" &&
            c.Status == "DRAFT" &&
            c.CreatedBy == userId
        ), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenOrgAdminCreatesForUnauthorizedOrg_ShouldThrowUnauthorizedAccessException()
    {
        var userId = Guid.NewGuid();
        var userOrgId = Guid.NewGuid();
        var targetOrgId = Guid.NewGuid();

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

        var handler = CreateHandler();
        var command = new CreateCampaignCommand(
            targetOrgId,
            "Chiến dịch Trái Phép",
            null,
            new DateOnly(2026, 6, 1),
            new DateOnly(2026, 6, 30)
        );

        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<UnauthorizedAccessException>()
            .WithMessage("*Bạn không có quyền tạo chiến dịch cho tổ chức này*");
    }
}
