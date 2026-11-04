using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using MiniExcelLibs;
using VolunteerManagerment.Infrastructure.Services;
using Xunit;

namespace VolunteerManagerment.Tests.Infrastructure.Services;

public class MiniExcelAndSupabaseStorageIntegrationTests
{
    public class SampleExcelVolunteerRow
    {
        public string? HoVaTen { get; set; }
        public string? MaSoSinhVien { get; set; }
        public string? LopHoc { get; set; }
        public string? SoDienThoai { get; set; }
    }

    [Fact]
    public async Task MiniExcelService_ReadAsync_ShouldNormalizeVietnameseHeadersAndMapProperties()
    {
        var excelService = new MiniExcelService();
        using var stream = new MemoryStream();

        var rawData = new List<Dictionary<string, object>>
        {
            new()
            {
                ["Họ và tên"] = "  Nguyễn Văn Đồng  ",
                ["Mã_số_sinh_viên"] = "0022410123",
                ["Lớp (Học)"] = "ĐHCNTT22A",
                ["Số điện thoại"] = "0912345678"
            }
        };

        await stream.SaveAsAsync(rawData);
        stream.Position = 0;

        var rows = await excelService.ReadAsync<SampleExcelVolunteerRow>(stream);

        rows.Should().ContainSingle();
        rows[0].HoVaTen.Should().Be("Nguyễn Văn Đồng");
        rows[0].MaSoSinhVien.Should().Be("0022410123");
        rows[0].LopHoc.Should().Be("ĐHCNTT22A");
        rows[0].SoDienThoai.Should().Be("0912345678");
    }

    [Fact]
    public async Task SupabaseStorageService_UploadFileAsync_ShouldSendAuthorizedRequestAndReturnPublicUrl()
    {
        HttpRequestMessage? capturedRequest = null;
        var handler = new FakeHttpMessageHandler(req =>
        {
            capturedRequest = req;
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"Key\":\"attendances/photo1.jpg\"}")
            };
        });

        var httpClient = new HttpClient(handler);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Supabase:Url"] = "https://xyz.supabase.co",
                ["Supabase:ServiceKey"] = "service-role-secret-key",
                ["Supabase:Bucket"] = "attendances"
            })
            .Build();

        var service = new SupabaseStorageService(
            httpClient,
            configuration,
            NullLogger<SupabaseStorageService>.Instance
        );

        using var fileStream = new MemoryStream([1, 2, 3, 4]);
        var publicUrl = await service.UploadFileAsync(fileStream, "photo1.jpg", "image/jpeg");

        publicUrl.Should().Be("https://xyz.supabase.co/storage/v1/object/public/attendances/photo1.jpg");
        capturedRequest.Should().NotBeNull();
        capturedRequest!.Method.Should().Be(HttpMethod.Post);
        capturedRequest.Headers.Authorization?.Parameter.Should().Be("service-role-secret-key");
        capturedRequest.Headers.GetValues("x-upsert").Should().Contain("true");
    }

    [Fact]
    public async Task SupabaseStorageService_WhenUploadReturnsErrorStatus_ShouldThrowInvalidOperationException()
    {
        var handler = new FakeHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.BadRequest)
        {
            Content = new StringContent("Bucket not found")
        });

        var httpClient = new HttpClient(handler);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Supabase:Url"] = "https://xyz.supabase.co",
                ["Supabase:ServiceKey"] = "service-role-secret-key"
            })
            .Build();

        var service = new SupabaseStorageService(
            httpClient,
            configuration,
            NullLogger<SupabaseStorageService>.Instance
        );

        using var fileStream = new MemoryStream([1, 2, 3]);
        var act = () => service.UploadFileAsync(fileStream, "bad.jpg", "image/jpeg");

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*Lỗi khi upload file lên Supabase: Bucket not found*");
    }

    private sealed class FakeHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> responder) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(responder(request));
        }
    }
}
