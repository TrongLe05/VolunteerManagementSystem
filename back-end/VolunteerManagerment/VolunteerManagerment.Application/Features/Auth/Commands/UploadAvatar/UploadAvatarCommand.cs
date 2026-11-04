using MediatR;

namespace VolunteerManagerment.Application.Features.Auth.Commands.UploadAvatar;

public record UploadAvatarCommand(
    Stream FileStream,
    string FileName,
    string ContentType
) : IRequest<string>;
