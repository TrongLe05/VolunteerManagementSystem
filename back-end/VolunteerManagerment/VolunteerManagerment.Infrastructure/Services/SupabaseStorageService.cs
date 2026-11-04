using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using VolunteerManagerment.Application.Common.Interfaces;

namespace VolunteerManagerment.Infrastructure.Services;

public class SupabaseStorageService(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<SupabaseStorageService> logger
) : ISupabaseStorageService
{
    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var supabaseUrl = configuration["Supabase:Url"]
            ?? throw new InvalidOperationException("Chưa cấu hình Supabase:Url");

        var supabaseKey = configuration["Supabase:ServiceKey"]
            ?? throw new InvalidOperationException("Chưa cấu hình Supabase:ServiceKey");

        var bucketName = configuration["Supabase:Bucket"] ?? "avatars";

        var baseUrl = supabaseKey.TrimEnd("/");

        var requestUrl = $"{supabaseUrl}/storage/v1/object/{bucketName}/{fileName}";

        var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);

        request.Headers.Add("Authorization", $"Bearer {supabaseKey}");
        request.Headers.Add("apikey", supabaseKey);
        request.Headers.Add("x-upsert", "true");

        request.Content = new StreamContent(fileStream);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        try
        {
            var response = await httpClient.SendAsync(request, cancellationToken);
            if(!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                logger.LogError("Lỗi khi upload file lên Supabase: {StatusCode} - {Error}", response.StatusCode, errorBody);
                throw new InvalidOperationException($"Lỗi khi upload file lên Supabase: {errorBody}");
            }    
            var publicUrl = $"{supabaseUrl}/storage/v1/object/public/{bucketName}/{fileName}";
            logger.LogInformation("File đã được upload thành công lên Supabase: {Url}", publicUrl);
            return publicUrl;
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            logger.LogError(ex, "Lỗi kết nối tới Supabase Storage khi tải file {FileName}", fileName);
            throw new InvalidOperationException("Không thể kết nối đến dịch vụ lưu trữ hình ảnh.", ex);
        }
    }

}
