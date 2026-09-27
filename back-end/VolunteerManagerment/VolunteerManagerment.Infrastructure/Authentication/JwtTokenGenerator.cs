using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Domain.Entities;
using Microsoft.IdentityModel.JsonWebTokens;

namespace VolunteerManagerment.Infrastructure.Authentication;

public sealed class JwtTokenGenerator(IConfiguration configuration) : IJwtTokenGenerator
{
    public string GenerateToken(User user, List<string> roles, string organizationName)
    {
        var secretKey = configuration["JwtSetting:Secret"] 
            ?? throw new InvalidOperationException("Chưa cấu hình secret key.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, user.Username),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("organization", organizationName)
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddHours(24),
            Issuer = configuration["JwtSetting:Issuer"],
            Audience = configuration["JwtSetting:Audience"],
            SigningCredentials = credentials
        };

        var tokenHandler = new JsonWebTokenHandler();

        return tokenHandler.CreateToken(tokenDescriptor);
    }
}
