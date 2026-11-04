using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Persistence;
using VolunteerManagerment.Infrastructure.Persistence.Repository;
using Xunit;

namespace VolunteerManagerment.Tests.Infrastructure.Persistence;

public class VolunteerAndCampaignRepositoryIntegrationTests
{
    private static ApplicationDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task VolunteerRepository_AllLookupAndExistenceMethods_ShouldWorkWithDatabase()
    {
        await using var context = CreateDbContext();
        var unitOfWork = new UnitOfWork(context);
        var volunteerRepo = new VolunteerRepository(context);

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Code = "DOAN_SP",
            Name = "Đoàn Khoa Sư Phạm",
            IsActive = true
        };
        var userId = Guid.NewGuid();
        var v1 = new Volunteer
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrganizationId = org.Id,
            Organization = org,
            VolunteerCode = "TNV-001",
            StudentCode = "0022410001",
            FullName = "Nguyễn Văn A",
            ConsentFaceAuth = true
        };
        var v2 = new Volunteer
        {
            Id = Guid.NewGuid(),
            UserId = null,
            OrganizationId = org.Id,
            Organization = org,
            VolunteerCode = "TNV-002",
            StudentCode = "0022410002",
            FullName = "Trần Thị B"
        };

        context.Organizations.Add(org);
        await volunteerRepo.AddRangeAsync([v1, v2]);
        await unitOfWork.SaveChangesAsync();

        var byUser = await volunteerRepo.GetByUserIdAsync(userId);
        byUser.Should().NotBeNull();
        byUser!.Organization.Name.Should().Be("Đoàn Khoa Sư Phạm");

        var byStudentCode = await volunteerRepo.GetByStudentCodeAsync("0022410002");
        byStudentCode.Should().NotBeNull();
        byStudentCode!.FullName.Should().Be("Trần Thị B");

        var existingCodes = await volunteerRepo.GetExistingStudentCodesAsync(["0022410001", "0022419999"]);
        existingCodes.Should().ContainSingle().Which.Should().Be("0022410001");

        var existingEntities = await volunteerRepo.GetExistingVolunteersByCodesAsync(["0022410001", "0022410002"]);
        existingEntities.Should().HaveCount(2);

        (await volunteerRepo.IsStudentCodeExistsAsync("0022410001")).Should().BeTrue();
        (await volunteerRepo.IsStudentCodeExistsAsync("0022410001", excludeId: v1.Id)).Should().BeFalse();

        (await volunteerRepo.IsVolunteerCodeExistsAsync("TNV-002")).Should().BeTrue();
        (await volunteerRepo.IsVolunteerCodeExistsAsync("TNV-002", excludeId: v2.Id)).Should().BeFalse();
    }

    [Fact]
    public async Task CampaignRepository_AndGenericRepositoryOperations_ShouldPersistChangesCorrectly()
    {
        await using var context = CreateDbContext();
        var unitOfWork = new UnitOfWork(context);
        var campaignRepo = new CampaignRepository(context);

        var org = new Organization { Id = Guid.NewGuid(), Code = "DT", Name = "Đoàn Trường", IsActive = true };
        var creator = new User { Id = Guid.NewGuid(), OrganizationId = org.Id, Username = "admin", Email = "a@dthu.edu.vn" };
        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Organization = org,
            CreatedBy = creator.Id,
            Creator = creator,
            Name = "Chiến dịch Xuân Tình Nguyện",
            Status = "ACTIVE"
        };

        context.Organizations.Add(org);
        context.Users.Add(creator);
        await campaignRepo.AddAsync(campaign);
        await unitOfWork.SaveChangesAsync();

        var withDetails = await campaignRepo.GetByIdWithDetailsAsync(campaign.Id);
        withDetails.Should().NotBeNull();
        withDetails!.Organization.Name.Should().Be("Đoàn Trường");
        withDetails.Creator.Username.Should().Be("admin");

        (await campaignRepo.IsCampaignExistsAsync(campaign.Id, org.Id)).Should().BeTrue();
        (await campaignRepo.IsCampaignExistsAsync(campaign.Id, org.Id, excludeId: campaign.Id)).Should().BeFalse();

        var allCampaigns = await campaignRepo.GetAllAsync();
        allCampaigns.Should().ContainSingle();

        var filtered = await campaignRepo.FindAsync(c => c.Status == "ACTIVE");
        filtered.Should().ContainSingle();

        campaignRepo.Delete(campaign);
        await unitOfWork.SaveChangesAsync();
        (await campaignRepo.GetByIdAsync(campaign.Id)).Should().BeNull();
    }
}
