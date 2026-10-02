using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Features.Auth.Commands.Logout;

public class LogoutCommandHandler(
    IUnitOfWork unitOfWork,
    IRepository<RefreshToken> refreshTokenRepository
) : IRequestHandler<LogoutCommand, bool>
{

    public async Task<bool> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        var tokens = await refreshTokenRepository.FindAsync(r => r.Token == request.RefreshToken, cancellationToken);

        var token = tokens.FirstOrDefault();
        if (token == null) return false;

        token.IsRevoked = true;
        token.RevokedAt = DateTimeOffset.UtcNow;
        refreshTokenRepository.Update(token);

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return true;
    }
}