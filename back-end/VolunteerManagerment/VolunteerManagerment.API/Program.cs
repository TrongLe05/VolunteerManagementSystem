using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Scalar.AspNetCore;
using Serilog;
using Serilog.Events;
using System.Security.Claims;
using System.Text;
using VolunteerManagerment.API.Hubs;
using VolunteerManagerment.API.Middlewares;
using VolunteerManagerment.API.Services;
using VolunteerManagerment.Application;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Infrastructure;

// 1. Khởi tạo Serilog Bootstrap Logger sớm nhất có thể
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
    .MinimumLevel.Override("Microsoft.AspNetCore", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    Log.Information(">>> Đang khởi động Hệ thống Quản lý Tình nguyện viên DThU - Web API...");

    var builder = WebApplication.CreateBuilder(args);

    // 2. Tích hợp Serilog vào ASP.NET Core Host
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .Enrich.WithProcessId()
        .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
        // File log tổng hợp cho toàn hệ thống
        .WriteTo.File(
            path: "logs/app-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 14,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] ({SourceContext}) {Message:lj}{NewLine}{Exception}")
        // File log chuyên biệt chỉ dành riêng cho Audit Trail
        .WriteTo.Logger(auditConfig => auditConfig
            .Filter.ByIncludingOnly(evt => evt.MessageTemplate.Text.Contains("[AUDIT]"))
            .WriteTo.File(
                path: "logs/audit-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30,
                outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"))
    );

    // Add services to the container.
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddSignalR();
    builder.Services.AddScoped<IDashboardNotificationService, DashboardNotificationService>();

    var secretKey = builder.Configuration["JwtSetting:Secret"]
            ?? throw new InvalidOperationException("Chưa cấu hình JwtSetting:Secret");

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["JwtSetting:Issuer"],
            ValidAudience = builder.Configuration["JwtSetting:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

    builder.Services.AddControllers();
    builder.Services.AddOpenApi(options =>
    {
        options.AddDocumentTransformer((document, context, cancellationToken) =>
        {
            var securityScheme = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Name = "Authorization",
                In = ParameterLocation.Header,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Nhập Access Token dạng: Bearer {token}"
            };

            document.Components ??= new OpenApiComponents();
            document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
            document.Components.SecuritySchemes.Add("Bearer", securityScheme);

            document.Security ??= new List<OpenApiSecurityRequirement>();
            document.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", document)] = new List<string>()
            });

            return Task.CompletedTask;
        });
    });

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.SetIsOriginAllowed(_ => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
    });

    var app = builder.Build();

    // 3. Serilog HTTP Request Logging tự động ghi vết request & thời gian xử lý
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            var userId = httpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? httpContext.User?.FindFirst("sub")?.Value;
            if (!string.IsNullOrEmpty(userId))
            {
                diagnosticContext.Set("UserId", userId);
            }

            var forwardedHeader = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            var clientIp = !string.IsNullOrWhiteSpace(forwardedHeader)
                ? forwardedHeader.Split(',', StringSplitOptions.RemoveEmptyEntries).FirstOrDefault()?.Trim()
                : httpContext.Connection?.RemoteIpAddress?.ToString();

            if (!string.IsNullOrEmpty(clientIp))
            {
                diagnosticContext.Set("ClientIp", clientIp);
            }
        };
    });

    app.UseMiddleware<ExceptionHandlingMiddleware>();

    // Configure OpenAPI & Scalar API Reference
    app.MapOpenApi();
    app.MapScalarApiReference(options =>
    {
        options.WithTitle("Hệ thống Quản lý Tình nguyện viên DThU - API Docs");
    });

    app.UseHttpsRedirection();

    app.UseCors("AllowFrontend");

    app.UseAuthentication();

    app.UseAuthorization();

    // Route chào mừng ở trang chủ domain
    app.MapGet("/", () => Results.Ok(new
    {
        service = "Hệ thống Quản lý Tình nguyện viên DThU - Web API",
        status = "Online",
        docs = "/scalar/v1",
        version = "1.0.0",
        timestamp = DateTimeOffset.UtcNow
    }));

    app.MapControllers();

    app.MapHub<DashboardHub>(DashboardHub.HubUrl);

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Ứng dụng bị dừng đột ngột do lỗi nghiêm trọng!");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
