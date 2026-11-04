using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Activities.Commands.CreateActivity;
using VolunteerManagerment.Application.Features.Activities.Commands.DeleteActivity;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Activities;

public class CreateAndDeleteActivityHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();
    private readonly Mock<IActivityRepository> _activityRepositoryMock = new();
    private readonly Mock<ICampaignRepository> _campaignRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    [Fact]
    public async Task CreateActivity_WhenSuperAdminAndDatesWithinCampaign_ShouldCreateOpenActivityWithLocations()
    {
        var userId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        _campaignRepositoryMock.Setup(r => r.GetByIdAsync(campaignId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Campaign
            {
                Id = campaignId,
                OrganizationId = Guid.NewGuid(),
                StartDate = new DateOnly(2026, 6, 1),
                EndDate = new DateOnly(2026, 8, 31),
                Status = "ACTIVE"
            });

        var handler = new CreateActivityCommandHandler(
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _activityRepositoryMock.Object,
            _campaignRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new CreateActivityCommand(
            CampaignId: campaignId,
            Name: "Ra quân Chủ Nhật Xanh",
            Description: "Dọn vệ sinh khuôn viên trường",
            StartTime: new DateTimeOffset(2026, 6, 15, 7, 0, 0, TimeSpan.FromHours(7)),
            EndTime: new DateTimeOffset(2026, 6, 15, 11, 0, 0, TimeSpan.FromHours(7)),
            Capacity: 100,
            CreditHours: 4.0m,
            CreditDays: 0.5m,
            Locations: new List<CreateActivityLocationRequest>
            {
                new("Cổng A ĐH Đồng Tháp", "783 Phạm Hữu Lầu", 10.4602m, 105.6426m, 150m)
            }
        );

        var result = await handler.Handle(command, CancellationToken.None);

        result.Should().NotBeEmpty();
        _activityRepositoryMock.Verify(r => r.AddAsync(It.Is<Activity>(a =>
            a.CampaignId == campaignId &&
            a.Name == "Ra quân Chủ Nhật Xanh" &&
            a.Status == "OPEN" &&
            a.Locations.Count == 1
        ), It.IsAny<CancellationToken>()), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateActivity_WhenDatesOutsideCampaignRange_ShouldThrowInvalidOperationException()
    {
        var userId = Guid.NewGuid();
        var campaignId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        _campaignRepositoryMock.Setup(r => r.GetByIdAsync(campaignId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Campaign
            {
                Id = campaignId,
                StartDate = new DateOnly(2026, 6, 1),
                EndDate = new DateOnly(2026, 6, 30),
                Status = "ACTIVE"
            });

        var handler = new CreateActivityCommandHandler(
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _activityRepositoryMock.Object,
            _campaignRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var command = new CreateActivityCommand(
            CampaignId: campaignId,
            Name: "Hoạt động Lệch Ngày",
            Description: null,
            StartTime: new DateTimeOffset(2026, 7, 5, 7, 0, 0, TimeSpan.FromHours(7)),
            EndTime: new DateTimeOffset(2026, 7, 5, 11, 0, 0, TimeSpan.FromHours(7)),
            Capacity: 50,
            CreditHours: 4m,
            CreditDays: 0.5m,
            Locations: []
        );

        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Thời gian hoạt động phải nằm trong khoảng thời gian của chiến dịch*");
    }

    [Fact]
    public async Task DeleteActivity_WhenSuperAdmin_ShouldDeleteAndSave()
    {
        var userId = Guid.NewGuid();
        var activityId = Guid.NewGuid();
        var activity = new Activity
        {
            Id = activityId,
            Campaign = new Campaign { OrganizationId = Guid.NewGuid() }
        };

        _activityRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(activityId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(activity);
        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User
            {
                Id = userId,
                UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
            });

        var handler = new DeleteActivityCommandHandler(
            _currentUserServiceMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object,
            _activityRepositoryMock.Object,
            _unitOfWorkMock.Object
        );

        var result = await handler.Handle(new DeleteActivityCommand(activityId), CancellationToken.None);

        result.Should().BeTrue();
        _activityRepositoryMock.Verify(r => r.Delete(activity), Times.Once);
        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
