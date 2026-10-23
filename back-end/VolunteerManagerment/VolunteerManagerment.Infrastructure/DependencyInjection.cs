using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Resend;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Infrastructure.Authentication;
using VolunteerManagerment.Infrastructure.Persistence;
using VolunteerManagerment.Infrastructure.Persistence.Repository;
using VolunteerManagerment.Infrastructure.Services;

namespace VolunteerManagerment.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null);
            })
            .UseSnakeCaseNamingConvention());

        services.AddScoped<IApplicationDbContext>(provider => 
            provider.GetRequiredService<ApplicationDbContext>());

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        services.AddScoped<IUserRepository, UserRepository>();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();  

        services.AddScoped<IVolunteerRepository, VolunteerRepository>();

        services.AddScoped<ICampaignRepository, CampaignRepository>();

        services.AddScoped<IActivityRepository, ActivityRepository>();

        services.AddScoped<IActivityRegistrationRepository, ActivityRegistrationRepository>();

        services.AddScoped<IAttendanceRepository, AttendanceRepository>();

        services.AddScoped<IAttendanceSessionRepository, AttendanceSessionRepository>();

        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

        services.AddSingleton<IPasswordHasher, BCryptPasswordHasher>();

        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddHttpClient<IResend, ResendClient>();
        services.AddOptions<ResendClientOptions>().Configure(options =>
        {
            options.ApiToken = configuration["Resend:ApiKey"] ?? string.Empty;
        });

        services.AddTransient<IEmailService, ResendEmailService>();

        services.AddScoped<IExcelService, MiniExcelService>();

        return services;
    }
}
