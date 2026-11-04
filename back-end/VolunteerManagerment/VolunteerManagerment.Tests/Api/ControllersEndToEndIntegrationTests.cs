using FluentAssertions;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using VolunteerManagerment.API.Controllers;
using VolunteerManagerment.Application;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Activities.Commands.CreateActivity;
using VolunteerManagerment.Application.Features.Activities.Commands.ReviewActivityRegistration;
using VolunteerManagerment.Application.Features.Activities.Commands.UpdateActivity;
using VolunteerManagerment.Application.Features.Attendances.Commands.CheckIn;
using VolunteerManagerment.Application.Features.Attendances.Commands.OpenAttendanceSession;
using VolunteerManagerment.Application.Features.Auth.Commands.Login;
using VolunteerManagerment.Application.Features.Auth.Commands.Logout;
using VolunteerManagerment.Application.Features.Auth.Commands.Register;
using VolunteerManagerment.Application.Features.Auth.DTOs;
using VolunteerManagerment.Application.Features.Campaigns.Commands.CreateCampaign;
using VolunteerManagerment.Application.Features.Campaigns.Commands.UpdateCampaign;
using VolunteerManagerment.Application.Features.Organizations.Commands.CreateOrganization;
using VolunteerManagerment.Application.Features.Organizations.Commands.UpdateOrganization;
using VolunteerManagerment.Application.Features.Organizations.DTOs;
using VolunteerManagerment.Application.Features.Volunteers.Commands.UpdateMyProfile;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;
using VolunteerManagerment.Domain.Entities;
using VolunteerManagerment.Infrastructure.Authentication;
using VolunteerManagerment.Infrastructure.Persistence;
using VolunteerManagerment.Infrastructure.Persistence.Repository;
using VolunteerManagerment.Infrastructure.Services;

namespace VolunteerManagerment.Tests.Api;

public class ControllersEndToEndIntegrationTests : IDisposable
{
    private readonly ServiceProvider _serviceProvider;
    private readonly ApplicationDbContext _dbContext;
    private readonly ISender _sender;
    private readonly Mock<ICurrentUserService> _currentUserMock;
    private readonly Mock<IDashboardNotificationService> _dashboardNotificationMock;

    public ControllersEndToEndIntegrationTests()
    {
        var services = new ServiceCollection();

        var configDict = new Dictionary<string, string?>
        {
            ["JwtSetting:Secret"] = "SuperSecretIntegrationKeyForVolunteerManagementSystem2026!",
            ["JwtSetting:Issuer"] = "VolunteerManagement.API",
            ["JwtSetting:Audience"] = "VolunteerManagement.Client",
            ["JwtSetting:ExpiryMinutes"] = "60"
        };
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(configDict)
            .Build();

        services.AddSingleton(configuration);

        var dbName = $"ApiE2EDb_{Guid.NewGuid()}";
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseInMemoryDatabase(dbName));
        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

        // Register real Repositories & UnitOfWork
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();
        services.AddScoped<IVolunteerRepository, VolunteerRepository>();
        services.AddScoped<ICampaignRepository, CampaignRepository>();
        services.AddScoped<IActivityRepository, ActivityRepository>();
        services.AddScoped<IActivityRegistrationRepository, ActivityRegistrationRepository>();
        services.AddScoped<IAttendanceRepository, AttendanceRepository>();
        services.AddScoped<IAttendanceSessionRepository, AttendanceSessionRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register real Auth services
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();

        // Register mockable external & user context services
        _currentUserMock = new Mock<ICurrentUserService>();
        _dashboardNotificationMock = new Mock<IDashboardNotificationService>();
        services.AddSingleton(_currentUserMock.Object);
        services.AddSingleton(_dashboardNotificationMock.Object);
        services.AddSingleton(new Mock<IEmailService>().Object);
        services.AddSingleton(new Mock<ISupabaseStorageService>().Object);

        // Register Application Layer (MediatR + ValidationBehavior + DashboardNotificationBehavior + Validators)
        services.AddLogging();
        services.AddApplication();

        _serviceProvider = services.BuildServiceProvider();
        _dbContext = _serviceProvider.GetRequiredService<ApplicationDbContext>();
        _sender = _serviceProvider.GetRequiredService<ISender>();
    }

    private async Task<User> SeedSuperAdminAsync(Organization org)
    {
        var superAdminRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Code == "SUPER_ADMIN");
        if (superAdminRole == null)
        {
            superAdminRole = new Role { Id = Guid.NewGuid(), Code = "SUPER_ADMIN", Name = "Quản trị hệ thống" };
            _dbContext.Roles.Add(superAdminRole);
        }

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Username = $"admin_{Guid.NewGuid():N}",
            Email = $"admin_{Guid.NewGuid():N}@dthu.edu.vn",
            PasswordHash = "hash",
            OrganizationId = org.Id,
            Organization = org,
            IsActive = true
        };
        adminUser.UserRoles.Add(new UserRole
        {
            UserId = adminUser.Id,
            RoleId = superAdminRole.Id,
            Role = superAdminRole,
            User = adminUser
        });

        _dbContext.Users.Add(adminUser);
        await _dbContext.SaveChangesAsync();
        return adminUser;
    }

    [Fact]
    public async Task AuthController_RegisterLoginAndLogout_EndToEndThroughMediatRPipeline_ShouldSucceed()
    {
        var org = new Organization { Id = Guid.NewGuid(), Name = "Đoàn Trường ĐH Đồng Tháp", Code = "DTHU", IsActive = true };
        var role = new Role { Id = Guid.NewGuid(), Code = "VOLUNTEER", Name = "Tình nguyện viên" };
        _dbContext.Organizations.Add(org);
        _dbContext.Roles.Add(role);
        await _dbContext.SaveChangesAsync();

        var controller = new AuthController(_sender);

        // 1. Register
        var registerCmd = new RegisterCommand(
            Username: "sinhvien2026",
            Email: "sinhvien@dthu.edu.vn",
            Password: "Password123!",
            OrganizationId: org.Id);

        var registerAction = await controller.Register(registerCmd, CancellationToken.None);
        var registerOk = registerAction.Should().BeOfType<OkObjectResult>().Subject;
        var registerResponse = registerOk.Value.Should().BeOfType<RegisterResponseDto>().Subject;
        registerResponse.Email.Should().Be("sinhvien@dthu.edu.vn");

        // 2. Login
        _dbContext.ChangeTracker.Clear();
        var loginCmd = new LoginCommand("sinhvien@dthu.edu.vn", "Password123!");
        var loginAction = await controller.Login(loginCmd, CancellationToken.None);
        var loginOk = loginAction.Should().BeOfType<OkObjectResult>().Subject;
        var loginResponse = loginOk.Value.Should().BeOfType<LoginResponseDto>().Subject;
        loginResponse.AccessToken.Should().NotBeNullOrWhiteSpace();
        loginResponse.RefreshToken.Should().NotBeNullOrWhiteSpace();
        loginResponse.User.Email.Should().Be("sinhvien@dthu.edu.vn");

        // 3. Logout
        _dbContext.ChangeTracker.Clear();
        var logoutAction = await controller.Logout(new LogoutCommand(loginResponse.RefreshToken), CancellationToken.None);
        logoutAction.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task AuthController_Login_WhenValidationFailsInMediatRPipeline_ShouldThrowValidationException()
    {
        var controller = new AuthController(_sender);
        var invalidLoginCmd = new LoginCommand("", "");

        var act = async () => await controller.Login(invalidLoginCmd, CancellationToken.None);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task OrganizationsController_CreateGetAndUpdateMismatch_ShouldWorkAndTriggerDashboardNotification()
    {
        var rootOrg = new Organization { Id = Guid.NewGuid(), Name = "Đoàn Trường", Code = "ROOT", IsActive = true };
        _dbContext.Organizations.Add(rootOrg);
        await _dbContext.SaveChangesAsync();

        var adminUser = await SeedSuperAdminAsync(rootOrg);
        _currentUserMock.Setup(u => u.UserId).Returns(adminUser.Id);

        var controller = new OrganizationsController(_sender);

        // 1. Create Organization
        var createCmd = new CreateOrganizationCommand(null, "HSV_DTHU", "Hội Sinh Viên DTHU", "Hội Sinh viên trường");
        var createResult = await controller.CreateOrganization(createCmd, CancellationToken.None);
        var okCreate = createResult.Should().BeOfType<OkObjectResult>().Subject;
        var orgId = (Guid)okCreate.Value!;
        orgId.Should().NotBeEmpty();

        // Verify DashboardNotificationBehavior triggered NotifyOrganizationChangedAsync
        _dashboardNotificationMock.Verify(
            n => n.NotifyOrganizationChangedAsync(It.IsAny<CancellationToken>()),
            Times.Once);

        // 2. Get Organizations
        var getResult = await controller.GetOrganizations("Hội Sinh Viên", CancellationToken.None);
        var okGet = getResult.Should().BeOfType<OkObjectResult>().Subject;
        var orgList = okGet.Value.Should().BeAssignableTo<IReadOnlyList<OrganizationDto>>().Subject;
        orgList.Should().ContainSingle(o => o.Code == "HSV_DTHU");

        // 3. Update with route/body mismatch returns BadRequestObjectResult
        var mismatchResult = await controller.UpdateOrganization(
            Guid.NewGuid(),
            new UpdateOrganizationCommand(orgId, null, "HSV_DTHU", "Tên Mới", "Mô tả", true),
            CancellationToken.None);

        mismatchResult.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CampaignsController_CreateCampaign_ShouldReturnCreatedAtAction_AndUpdateMismatchShouldReturnBadRequest()
    {
        var org = new Organization { Id = Guid.NewGuid(), Name = "Đoàn Khoa CNTT", Code = "CNTT", IsActive = true };
        _dbContext.Organizations.Add(org);
        await _dbContext.SaveChangesAsync();

        var adminUser = await SeedSuperAdminAsync(org);
        _currentUserMock.Setup(u => u.UserId).Returns(adminUser.Id);

        var controller = new CampaignsController(_sender);

        var startDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(2));
        var endDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(20));
        var createCmd = new CreateCampaignCommand(
            org.Id,
            "Chiến dịch Xuân Tình Nguyện 2026",
            "Mô tả chiến dịch",
            startDate,
            endDate);

        var createAction = await controller.CreateCampaign(createCmd, CancellationToken.None);
        var createdResult = createAction.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be(nameof(CampaignsController.GetCampaignById));
        var campaignId = (Guid)createdResult.Value!;
        campaignId.Should().NotBeEmpty();

        _dashboardNotificationMock.Verify(
            n => n.NotifyCampaignChangedAsync(It.IsAny<CancellationToken>()),
            Times.Once);

        // Route/Body mismatch check
        var mismatchAction = await controller.UpdateCampaign(
            Guid.NewGuid(),
            new UpdateCampaignCommand(campaignId, "Tên", null, startDate, endDate, "OPEN"),
            CancellationToken.None);
        mismatchAction.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task ActivitiesController_CreateRegisterAndCancel_EndToEnd_ShouldWorkCorrectly()
    {
        var org = new Organization { Id = Guid.NewGuid(), Name = "Đoàn Trường", Code = "DT", IsActive = true };
        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Organization = org,
            Name = "Mùa Hè Xanh",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-1)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
            Status = "OPEN"
        };
        var volunteerUserId = Guid.NewGuid();
        var user = new User { Id = volunteerUserId, Username = "tnv1", Email = "tnv@dthu.edu.vn", PasswordHash = "hash", OrganizationId = org.Id, Organization = org, IsActive = true };
        var volunteer = new Volunteer
        {
            Id = Guid.NewGuid(),
            UserId = volunteerUserId,
            OrganizationId = org.Id,
            Organization = org,
            FullName = "Lê Thị B",
            StudentCode = "0022410999",
            User = user
        };

        _dbContext.Organizations.Add(org);
        _dbContext.Campaigns.Add(campaign);
        _dbContext.Users.Add(user);
        _dbContext.Volunteers.Add(volunteer);
        await _dbContext.SaveChangesAsync();

        var adminUser = await SeedSuperAdminAsync(org);

        // 1. Admin creates Activity
        _currentUserMock.Setup(u => u.UserId).Returns(adminUser.Id);

        var controller = new ActivitiesController(_sender);
        var createCmd = new CreateActivityCommand(
            campaign.Id,
            "Ra quân dọn vệ sinh khuôn viên",
            "Mô tả hoạt động",
            DateTimeOffset.UtcNow.AddDays(2),
            DateTimeOffset.UtcNow.AddDays(2).AddHours(4),
            50,
            4.0m,
            0.5m,
            [new CreateActivityLocationRequest("Sân trường DTHU", "783 Phạm Hữu Lầu", 10.4602m, 105.6425m, 150m)]);

        var createAction = await controller.CreateActivity(createCmd, CancellationToken.None);
        var createdResult = createAction.Should().BeOfType<CreatedAtActionResult>().Subject;
        var activityId = (Guid)createdResult.Value!;

        // Re-set activity status to OPEN so volunteer can register
        var createdActivity = await _dbContext.Activities.FindAsync(activityId);
        createdActivity!.Status = "OPEN";
        await _dbContext.SaveChangesAsync();

        // 2. Volunteer registers for Activity
        _currentUserMock.Setup(u => u.UserId).Returns(volunteerUserId);

        var registerAction = await controller.RegisterActivity(activityId, CancellationToken.None);
        registerAction.Should().BeOfType<OkObjectResult>();

        // 3. Volunteer cancels registration
        var cancelAction = await controller.CancelActivityRegistration(activityId, CancellationToken.None);
        cancelAction.Should().BeOfType<OkObjectResult>();

        // 4. Route/Body mismatch on UpdateActivity and ReviewActivityRegistration
        var updateMismatch = await controller.UpdateActivity(
            Guid.NewGuid(),
            new UpdateActivityCommand(activityId, "Tên", null, DateTimeOffset.UtcNow.AddDays(2), DateTimeOffset.UtcNow.AddDays(3), 20, 4m, 0.5m, "OPEN", []),
            CancellationToken.None);
        updateMismatch.Should().BeOfType<BadRequestObjectResult>();

        var reviewMismatch = await controller.ReviewActivityRegistration(
            Guid.NewGuid(),
            Guid.NewGuid(),
            new ReviewActivityRegistrationCommand(activityId, Guid.NewGuid(), "APPROVED"),
            CancellationToken.None);
        reviewMismatch.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task AttendancesController_OpenSessionAndCheckInAndCloseSession_EndToEnd_ShouldSucceed()
    {
        var org = new Organization { Id = Guid.NewGuid(), Name = "Đoàn Trường", Code = "DT2", IsActive = true };
        _dbContext.Organizations.Add(org);
        await _dbContext.SaveChangesAsync();

        var adminUser = await SeedSuperAdminAsync(org);

        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            OrganizationId = org.Id,
            Name = "Chiến dịch Tình Nguyện",
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-2)),
            EndDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(10)),
            Status = "OPEN",
            Organization = org,
            CreatedBy = adminUser.Id,
            Creator = adminUser
        };
        var activityId = Guid.NewGuid();
        var activity = new Activity
        {
            Id = activityId,
            CampaignId = campaign.Id,
            Campaign = campaign,
            Name = "Hiến máu tình nguyện",
            StartTime = DateTimeOffset.UtcNow.AddHours(-1),
            EndTime = DateTimeOffset.UtcNow.AddHours(3),
            Capacity = 100,
            CreditHours = 4m,
            CreditDays = 0.5m,
            Status = "ONGOING",
            CreatedBy = adminUser.Id,
            Creator = adminUser,
            Locations =
            [
                new ActivityLocation
                {
                    Id = Guid.NewGuid(),
                    ActivityId = activityId,
                    Name = "Hội trường H1",
                    Latitude = 10.4602m,
                    Longitude = 105.6425m,
                    AllowedRadiusMeters = 200m
                }
            ]
        };

        var userId = Guid.NewGuid();
        var volunteerId = Guid.NewGuid();
        var user = new User { Id = userId, Username = "checkin_user", Email = "checkin@dthu.edu.vn", PasswordHash = "hash", OrganizationId = org.Id, Organization = org, IsActive = true };
        var volunteer = new Volunteer
        {
            Id = volunteerId,
            UserId = userId,
            OrganizationId = org.Id,
            Organization = org,
            FullName = "Phạm Văn C",
            StudentCode = "0022410888",
            User = user
        };
        var registration = new ActivityRegistration
        {
            Id = Guid.NewGuid(),
            ActivityId = activity.Id,
            Activity = activity,
            VolunteerId = volunteer.Id,
            Volunteer = volunteer,
            Status = "APPROVED",
            RegisteredAt = DateTimeOffset.UtcNow.AddDays(-1)
        };

        _dbContext.Campaigns.Add(campaign);
        _dbContext.Activities.Add(activity);
        _dbContext.Users.Add(user);
        _dbContext.Volunteers.Add(volunteer);
        _dbContext.ActivityRegistrations.Add(registration);
        await _dbContext.SaveChangesAsync();

        var controller = new AttendancesController(_sender);

        // 1. Admin opens attendance session
        _currentUserMock.Setup(u => u.UserId).Returns(adminUser.Id);

        var openAction = await controller.OpenSession(
            new OpenAttendanceSessionCommand(activity.Id, "CHECK_IN", 15),
            CancellationToken.None);
        openAction.Should().BeOfType<OkObjectResult>();

        var activeSession = await _dbContext.AttendanceSessions.FirstAsync(s => s.ActivityId == activity.Id);

        // 2. Volunteer checks in with GPS inside geofence
        _currentUserMock.Setup(u => u.UserId).Returns(userId);

        var checkInAction = await controller.CheckIn(
            new CheckInCommand(activity.Id, 10.4602m, 105.6425m, 10m, null),
            CancellationToken.None);
        var checkInOk = checkInAction.Should().BeOfType<OkObjectResult>().Subject;
        var checkInDto = checkInOk.Value.Should().BeOfType<CheckInResultDto>().Subject;
        checkInDto.Success.Should().BeTrue();
        checkInDto.IsInsideGeofence.Should().BeTrue();

        // 3. Admin closes session
        _currentUserMock.Setup(u => u.UserId).Returns(adminUser.Id);
        var closeAction = await controller.CloseSession(activeSession.Id, CancellationToken.None);
        closeAction.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task VolunteersController_GetAndUpdateMyProfile_EndToEnd_ShouldSucceed()
    {
        var org = new Organization { Id = Guid.NewGuid(), Name = "Khoa Sư Phạm", Code = "SP", IsActive = true };
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Username = "sp_user", Email = "sp@dthu.edu.vn", PasswordHash = "hash", OrganizationId = org.Id, Organization = org, IsActive = true };
        var volunteer = new Volunteer
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrganizationId = org.Id,
            Organization = org,
            FullName = "Trần Thị D",
            StudentCode = "0022410777",
            User = user
        };

        _dbContext.Organizations.Add(org);
        _dbContext.Users.Add(user);
        _dbContext.Volunteers.Add(volunteer);
        await _dbContext.SaveChangesAsync();

        _currentUserMock.Setup(u => u.UserId).Returns(userId);

        var controller = new VolunteersController(_sender);

        // 1. Update profile
        var updateCmd = new UpdateMyProfileCommand(
            FullName: "Trần Thị D (Đã Cập Nhật)",
            Phone: "0988777666",
            Gender: "FEMALE",
            DateOfBirth: new DateOnly(2004, 8, 20),
            ClassName: "ĐHSPT22A",
            StudentCode: "0022410777",
            ConsentFaceAuth: true);

        var updateAction = await controller.UpdateMyProfile(updateCmd, CancellationToken.None);
        updateAction.Should().BeOfType<OkObjectResult>();

        // 2. Get profile
        var getAction = await controller.GetMyProfile(CancellationToken.None);
        var getOk = getAction.Should().BeOfType<OkObjectResult>().Subject;
        var profileDto = getOk.Value.Should().BeOfType<VolunteerDto>().Subject;
        profileDto.FullName.Should().Be("Trần Thị D (Đã Cập Nhật)");
        profileDto.ClassName.Should().Be("ĐHSPT22A");
    }

    [Fact]
    public async Task UsersController_ToggleUserStatus_EndToEnd_ShouldUpdateUserStatusInDatabase()
    {
        var org = new Organization { Id = Guid.NewGuid(), Name = "Đoàn Trường", Code = "DT3", IsActive = true };
        var targetUser = new User
        {
            Id = Guid.NewGuid(),
            Username = "target_user",
            Email = "target@dthu.edu.vn",
            PasswordHash = "hash",
            OrganizationId = org.Id,
            Organization = org,
            IsActive = true
        };
        _dbContext.Organizations.Add(org);
        _dbContext.Users.Add(targetUser);
        await _dbContext.SaveChangesAsync();

        var adminUser = await SeedSuperAdminAsync(org);
        _currentUserMock.Setup(u => u.UserId).Returns(adminUser.Id);

        var controller = new UsersController(_sender);

        var actionResult = await controller.ToggleUserStatus(
            targetUser.Id,
            new ToggleUserStatusRequest(false),
            CancellationToken.None);

        actionResult.Should().BeOfType<OkObjectResult>();

        var updatedUser = await _dbContext.Users.FindAsync(targetUser.Id);
        updatedUser!.IsActive.Should().BeFalse();
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _serviceProvider.Dispose();
    }
}
