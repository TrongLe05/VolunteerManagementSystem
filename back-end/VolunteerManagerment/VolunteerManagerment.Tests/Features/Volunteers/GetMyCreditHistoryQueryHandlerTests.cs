using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Volunteers.Queries.GetMyCreditHistory;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Volunteers;

public class GetMyCreditHistoryQueryHandlerTests
{
    private readonly Mock<ICurrentUserService> _currentUserServiceMock = new();
    private readonly Mock<IVolunteerRepository> _volunteerRepositoryMock = new();

    private ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Handle_WhenVolunteerHasRecords_ShouldReturnCorrectSummaryAndList()
    {
        // Arrange
        var context = CreateInMemoryDbContext();
        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();

        _currentUserServiceMock.Setup(s => s.UserId).Returns(userId);

        var volunteer = new Volunteer
        {
            Id = volunteerId,
            UserId = userId,
            FullName = "Lê Minh",
            StudentCode = "DH52000001"
        };
        _volunteerRepositoryMock.Setup(r => r.GetByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(volunteer);

        var record1 = new VolunteerCreditRecord
        {
            Id = Guid.NewGuid(),
            VolunteerId = volunteerId,
            CreditDays = 1.0m,
            RecordType = VolunteerCreditRecord.RecordTypeActivityCompletion,
            Status = VolunteerCreditRecord.StatusOfficial,
            AwardedAt = DateTimeOffset.UtcNow.AddDays(-2),
            Reason = "Hoạt động Tiếp sức mùa thi"
        };

        var record2 = new VolunteerCreditRecord
        {
            Id = Guid.NewGuid(),
            VolunteerId = volunteerId,
            CreditDays = 0.5m,
            RecordType = VolunteerCreditRecord.RecordTypeBloodDonation,
            Status = VolunteerCreditRecord.StatusOfficial,
            AwardedAt = DateTimeOffset.UtcNow.AddDays(-1),
            Reason = "Hiến máu tình nguyện"
        };

        var revokedRecord = new VolunteerCreditRecord
        {
            Id = Guid.NewGuid(),
            VolunteerId = volunteerId,
            CreditDays = 1.0m,
            RecordType = VolunteerCreditRecord.RecordTypeManualAward,
            Status = VolunteerCreditRecord.StatusRevoked,
            AwardedAt = DateTimeOffset.UtcNow.AddDays(-3),
            Reason = "Thu hồi do trùng lặp"
        };

        context.VolunteerCreditRecords.AddRange(record1, record2, revokedRecord);
        await context.SaveChangesAsync();

        var handler = new GetMyCreditHistoryQueryHandler(context, _currentUserServiceMock.Object, _volunteerRepositoryMock.Object);

        // Act
        var result = await handler.Handle(new GetMyCreditHistoryQuery(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.VolunteerId.Should().Be(volunteerId);
        result.FullName.Should().Be("Lê Minh");
        result.StudentCode.Should().Be("DH52000001");
        result.TotalCreditDays.Should().Be(1.5m); // 1.0 + 0.5 (revoked is excluded from total)
        result.TotalOfficialRecords.Should().Be(2);
        result.Records.Should().HaveCount(3);
    }
}
