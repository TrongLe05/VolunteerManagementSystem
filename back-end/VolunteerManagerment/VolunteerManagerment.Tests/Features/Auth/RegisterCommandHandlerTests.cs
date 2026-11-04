using System.Linq.Expressions;
using FluentAssertions;
using Moq;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;
using VolunteerManagerment.Application.Features.Auth.Commands.Register;
using VolunteerManagerment.Domain.Entities;
using Xunit;

namespace VolunteerManagerment.Tests.Features.Auth;

public class RegisterCommandHandlerTests
{
    private readonly Mock<IUserRepository> _userRepositoryMock = new();
    private readonly Mock<IRepository<Role>> _roleRepositoryMock = new();
    private readonly Mock<IVolunteerRepository> _volunteerRepositoryMock = new();
    private readonly Mock<IUnitOfWork> _unitOfWorkMock = new();

    private RegisterCommandHandler CreateHandler() => new(
        _userRepositoryMock.Object,
        _roleRepositoryMock.Object,
        _volunteerRepositoryMock.Object,
        _unitOfWorkMock.Object
    );

    [Fact]
    public async Task Handle_WhenValidNewUser_ShouldCreateUserAndVolunteerProfileWithDefaultConsentFalse()
    {
        var orgId = Guid.NewGuid();
        var roleId = Guid.NewGuid();

        _userRepositoryMock.Setup(r => r.IsUsernameOrEmailExistedAsync("new_volunteer", "nv@dthu.edu.vn", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        _roleRepositoryMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Role, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Role> { new() { Id = roleId, Code = "VOLUNTEER" } });

        var handler = CreateHandler();
        var command = new RegisterCommand("new_volunteer", "nv@dthu.edu.vn", "StrongPass@123", orgId);

        var result = await handler.Handle(command, CancellationToken.None);

        result.Email.Should().Be("nv@dthu.edu.vn");
        result.Id.Should().NotBeEmpty();

        _userRepositoryMock.Verify(r => r.AddAsync(It.Is<User>(u =>
            u.Username == "new_volunteer" &&
            u.Email == "nv@dthu.edu.vn" &&
            u.OrganizationId == orgId &&
            u.IsActive
        ), It.IsAny<CancellationToken>()), Times.Once);

        _volunteerRepositoryMock.Verify(r => r.AddAsync(It.Is<Volunteer>(v =>
            v.UserId == result.Id &&
            v.OrganizationId == orgId &&
            v.ConsentFaceAuth == false &&
            v.VolunteerCode.StartsWith("TNV-")
        ), It.IsAny<CancellationToken>()), Times.Once);

        _unitOfWorkMock.Verify(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_WhenUsernameOrEmailAlreadyExists_ShouldThrowInvalidOperationException()
    {
        _userRepositoryMock.Setup(r => r.IsUsernameOrEmailExistedAsync("dup_user", "dup@dthu.edu.vn", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var handler = CreateHandler();
        var command = new RegisterCommand("dup_user", "dup@dthu.edu.vn", "Pass@123", Guid.NewGuid());

        var act = () => handler.Handle(command, CancellationToken.None);
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Username hoặc Email đã được sử dụng*");
    }
}
