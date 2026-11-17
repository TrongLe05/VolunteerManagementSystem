using Google.Apis.Auth;
using Microsoft.Extensions.Configuration;
using VolunteerManagerment.Application.Common.Interfaces;

namespace VolunteerManagerment.Infrastructure.Services;

public class GoogleAuthService(IConfiguration configuration) : IGoogleAuthService
{
    public async Task<GoogleUserPayload> VerifyGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        var clientId = configuration["GoogleAuth:ClientId"]
            ?? throw new InvalidOperationException("Chưa cấu hình GoogleAuth ClientId.");

        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = [clientId]
            };
            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);

            if (!payload.EmailVerified) 
                throw new UnauthorizedAccessException("Tài khoản Google chưa xác thực Email.");

            return new GoogleUserPayload(
                Email: payload.Email,
                FullName: payload.Name,
                AvartarUrl: payload.Picture,
                Subject: payload.Subject
            );
        }
        catch (InvalidJwtException)
        {
            throw new UnauthorizedAccessException("Token đăng nhập Google không hợp lệ hoặc hết hạn.");
        }
    }
}
