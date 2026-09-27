using VolunteerManagerment.Domain.Entities;

namespace VolunteerManagerment.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user, List<string> roles, string organizationName);
}