namespace VolunteerManagerment.Application.Common.Interfaces;

public interface ISupabaseStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default);
}
