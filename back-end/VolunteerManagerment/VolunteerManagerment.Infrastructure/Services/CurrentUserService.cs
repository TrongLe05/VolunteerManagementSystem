using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using VolunteerManagerment.Application.Common.Interfaces;

namespace VolunteerManagerment.Infrastructure.Services;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var userIdString = httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? httpContextAccessor.HttpContext?.User?.FindFirst("sub")?.Value;
            return Guid.TryParse(userIdString, out var userId) ? userId : null;
        }
    }

    public string? UserEmail =>
        httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value
        ?? httpContextAccessor.HttpContext?.User?.FindFirst("email")?.Value;

    public string? IpAddress
    {
        get
        {
            var httpContext = httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            // Kiểm tra header X-Forwarded-For nếu chạy sau Reverse Proxy / Cloudflare / Azure Application Gateway
            var forwardedHeader = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrWhiteSpace(forwardedHeader))
            {
                var ips = forwardedHeader.Split(',', StringSplitOptions.RemoveEmptyEntries);
                if (ips.Length > 0)
                {
                    return ips[0].Trim();
                }
            }

            return httpContext.Connection?.RemoteIpAddress?.ToString();
        }
    }
}
