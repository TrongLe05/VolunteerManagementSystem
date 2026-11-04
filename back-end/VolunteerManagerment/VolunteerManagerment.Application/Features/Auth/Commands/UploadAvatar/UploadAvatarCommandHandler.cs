using MediatR;
using VolunteerManagerment.Application.Common.Interfaces;
using VolunteerManagerment.Application.Common.Interfaces.Repositories;

namespace VolunteerManagerment.Application.Features.Auth.Commands.UploadAvatar;

public class UploadAvatarCommandHandler(
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    ISupabaseStorageService supabaseStorageService,
    IUnitOfWork unitOfWork
) : IRequestHandler<UploadAvatarCommand, string>
{
    private const long MaxFileSize = 5 * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    private static readonly string[] AllowedContentTypes = ["image/jpeg", "image/png", "image/webp"];
    public async Task<string> Handle(UploadAvatarCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new UnauthorizedAccessException("Không xác định được người dùng.");

        var user = await userRepository.GetByIdWithDetailsAsync(userId, cancellationToken)
            ?? throw new InvalidOperationException("Người dùng không tồn tại.");

        if (!user.IsActive)
            throw new InvalidOperationException("Tài khoản của bạn bị vô hiệu hoá.");

        if (request.FileStream == null || request.FileStream.Length == 0)
            throw new ArgumentException("File không được để trống.");

        if (request.FileStream.Length > MaxFileSize) 
            throw new ArgumentException("Kích thước file vượt quá giới hạn cho phép (5MB).");

        var extension = Path.GetExtension(request.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension) || !AllowedContentTypes.Contains(request.ContentType.ToLowerInvariant()))
            throw new ArgumentException("Chỉ chấp nhận các định dạng ảnh: .jpg, .jpeg, .png, .webp.");

        var remoteFileName = $"users/{userId}/avatar_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{extension}";

        var publicAvatarUrl = await supabaseStorageService.UploadFileAsync(
            request.FileStream,
            remoteFileName,
            request.ContentType,
            cancellationToken
        );

        user.AvatarUrl = publicAvatarUrl;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await unitOfWork.SaveChangesAsync(cancellationToken);

        return publicAvatarUrl;
    }
}
