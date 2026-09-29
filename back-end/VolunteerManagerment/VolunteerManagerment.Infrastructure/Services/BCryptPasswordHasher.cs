using VolunteerManagerment.Application.Common.Interfaces;
using BC = BCrypt.Net.BCrypt;

namespace VolunteerManagerment.Infrastructure.Services;

public class BCryptPasswordHasher : IPasswordHasher
{
    public string HashPassword(string password)
    {
        return BC.HashPassword(password);
    }

    public bool VerifyPassword(string password, string hashedPassword)
    {
        return BC.Verify(password, hashedPassword);
    }
}
