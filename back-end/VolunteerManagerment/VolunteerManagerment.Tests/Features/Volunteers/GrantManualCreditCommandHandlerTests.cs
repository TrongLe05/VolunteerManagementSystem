using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.Commands.GrantManualCredit;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Volunteers;

public class GrantManualCreditCommandHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IVolunteerRepository> _volunteerRepositoryMock = new();
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IOrganizationRepository> _organizationRepositoryMock = new();

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenValidSuperAdmin_ShouldCreateOfficialRecord()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(adminId);

        var adminUser = new User
        {
            Id = adminId,
            Username = "superadmin",
            UserRoles = new List<UserRole> { new() { Role = new Role { Code = "SUPER_ADMIN" } } }
        };
        _userRepositoryMock.Setup(r => r.GetByIdWithDetailsAsync(adminId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(adminUser);

        var volunteer = new Volunteer
        {
            Id = volunteerId,
            FullName = "Nguyễn Văn D",
            OrganizationId = Guid.NewGuid()
        };
        _volunteerRepositoryMock.Setup(r => r.GetByIdAsync(volunteerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(volunteer);

        var handler = new GrantManualCreditCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _volunteerRepositoryMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object
        );

        var command = new GrantManualCreditCommand(
            VolunteerId: volunteerId,
            CreditDays: 1.0m,
            RecordType: VolunteerCreditRecord.RecordTypeBloodDonation,
            Reason: "Tham gia ngày hội Hiến máu nhân đạo đợt 2"
        );

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.CreditDays.Should().Be(1.0m);
        result.RecordType.Should().Be(VolunteerCreditRecord.RecordTypeBloodDonation);
        result.Status.Should().Be(VolunteerCreditRecord.StatusOfficial);
        result.AwardedByName.Should().Be("superadmin");

        var dbRecord = await context.VolunteerCreditRecords.FirstOrDefaultAsync(c => c.VolunteerId == volunteerId);
        dbRecord.Should().NotBeNull();
        dbRecord!.CreditDays.Should().Be(1.0m);
    }

    [Fact]
    public async Task Handle_WhenCreditDaysIsZero_ShouldThrowArgumentException()
    {
        var context = CreateInMemoryDbContext();
        var handler = new GrantManualCreditCommandHandler(
            context,
            _currentUserServiceMock.Object,
            _volunteerRepositoryMock.Object,
            _userRepositoryMock.Object,
            _organizationRepositoryMock.Object
        );

        var command = new GrantManualCreditCommand(
            VolunteerId: Guid.NewGuid(),
            CreditDays: 0m,
            RecordType: "MANUAL_AWARD",
            Reason: "Test 0 days"
        );

        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<ArgumentException>()
            .WithMessage("*khác 0*");
    }
}
