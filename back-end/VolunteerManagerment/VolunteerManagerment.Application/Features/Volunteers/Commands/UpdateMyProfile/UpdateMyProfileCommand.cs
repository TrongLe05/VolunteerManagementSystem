using MediatR;

namespace VolunteerManagerment.Application.Features.Volunteers.Commands.UpdateMyProfile;

public record UpdateMyProfileCommand(
    string FullName,
    string? Phone,
    string? Gender,
    DateOnly? DateOfBirth,
    string? ClassName,
    string? StudentCode,
    bool ConsentFaceAuth
) : IRequest<bool>;
