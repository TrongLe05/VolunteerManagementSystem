namespace VolunteerManagerment.Application.Common.Interfaces;

public record GoogleUserPayload(
    string Email,
    string FullName,
    string? AvartarUrl,
    string Subject
);
public interface IGoogleAuthService
{
    Task<GoogleUserPayload> VerifyGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default);
}
