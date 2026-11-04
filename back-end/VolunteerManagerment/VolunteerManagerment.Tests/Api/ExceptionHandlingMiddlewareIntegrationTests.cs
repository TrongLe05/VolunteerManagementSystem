using System.Text.Json;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using VolunteerManagerment.API.Middlewares;
using VolunteerManagerment.Domain.Exceptions;

namespace VolunteerManagerment.Tests.Api;

public class ExceptionHandlingMiddlewareIntegrationTests
{
    private static async Task<(int StatusCode, JsonDocument Body)> InvokeMiddlewareWithExceptionAsync(Exception exceptionToThrow)
    {
        var context = new DefaultHttpContext();
        using var responseStream = new MemoryStream();
        context.Response.Body = responseStream;

        RequestDelegate next = _ => throw exceptionToThrow;
        var middleware = new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);

        await middleware.InvokeAsync(context);

        responseStream.Position = 0;
        var jsonDoc = await JsonDocument.ParseAsync(responseStream);
        return (context.Response.StatusCode, jsonDoc);
    }

    [Fact]
    public async Task InvokeAsync_WhenNoException_ShouldCompleteWith200Ok()
    {
        var context = new DefaultHttpContext();
        var nextCalled = false;
        RequestDelegate next = ctx =>
        {
            nextCalled = true;
            ctx.Response.StatusCode = StatusCodes.Status200OK;
            return Task.CompletedTask;
        };

        var middleware = new ExceptionHandlingMiddleware(next, NullLogger<ExceptionHandlingMiddleware>.Instance);
        await middleware.InvokeAsync(context);

        nextCalled.Should().BeTrue();
        context.Response.StatusCode.Should().Be(StatusCodes.Status200OK);
    }

    [Fact]
    public async Task InvokeAsync_WhenValidationExceptionThrown_ShouldReturn400WithGroupedErrors()
    {
        var failures = new List<ValidationFailure>
        {
            new("Email", "Email không hợp lệ."),
            new("Password", "Mật khẩu phải từ 6 ký tự."),
            new("Password", "Mật khẩu phải chứa chữ hoa.")
        };
        var validationEx = new ValidationException(failures);

        var (statusCode, body) = await InvokeMiddlewareWithExceptionAsync(validationEx);

        statusCode.Should().Be(StatusCodes.Status400BadRequest);
        body.RootElement.GetProperty("statusCode").GetInt32().Should().Be(400);
        body.RootElement.GetProperty("message").GetString().Should().Be("Email không hợp lệ.");

        var errorsElement = body.RootElement.GetProperty("errors");
        errorsElement.GetProperty("Email").GetArrayLength().Should().Be(1);
        errorsElement.GetProperty("Password").GetArrayLength().Should().Be(2);
    }

    [Fact]
    public async Task InvokeAsync_WhenDomainExceptionThrown_ShouldReturn400BadRequest()
    {
        var domainEx = new DomainException("Tình nguyện viên đã đăng ký hoạt động này.");

        var (statusCode, body) = await InvokeMiddlewareWithExceptionAsync(domainEx);

        statusCode.Should().Be(StatusCodes.Status400BadRequest);
        body.RootElement.GetProperty("statusCode").GetInt32().Should().Be(400);
        body.RootElement.GetProperty("message").GetString().Should().Be("Tình nguyện viên đã đăng ký hoạt động này.");
        body.RootElement.GetProperty("errors").ValueKind.Should().Be(JsonValueKind.Null);
    }

    [Fact]
    public async Task InvokeAsync_WhenArgumentExceptionThrown_ShouldReturn400BadRequest()
    {
        var argEx = new ArgumentException("Tham số truyền vào không hợp lệ.");

        var (statusCode, body) = await InvokeMiddlewareWithExceptionAsync(argEx);

        statusCode.Should().Be(StatusCodes.Status400BadRequest);
        body.RootElement.GetProperty("statusCode").GetInt32().Should().Be(400);
        body.RootElement.GetProperty("message").GetString().Should().Be("Tham số truyền vào không hợp lệ.");
    }

    [Fact]
    public async Task InvokeAsync_WhenUnauthorizedAccessExceptionThrown_ShouldReturn401Unauthorized()
    {
        var unauthEx = new UnauthorizedAccessException("Bạn không có quyền truy cập tài nguyên này.");

        var (statusCode, body) = await InvokeMiddlewareWithExceptionAsync(unauthEx);

        statusCode.Should().Be(StatusCodes.Status401Unauthorized);
        body.RootElement.GetProperty("statusCode").GetInt32().Should().Be(401);
        body.RootElement.GetProperty("message").GetString().Should().Be("Bạn không có quyền truy cập tài nguyên này.");
    }

    [Fact]
    public async Task InvokeAsync_WhenKeyNotFoundExceptionThrown_ShouldReturn404NotFound()
    {
        var notFoundEx = new KeyNotFoundException("Không tìm thấy chiến dịch.");

        var (statusCode, body) = await InvokeMiddlewareWithExceptionAsync(notFoundEx);

        statusCode.Should().Be(StatusCodes.Status404NotFound);
        body.RootElement.GetProperty("statusCode").GetInt32().Should().Be(404);
        body.RootElement.GetProperty("message").GetString().Should().Be("Không tìm thấy chiến dịch.");
    }

    [Fact]
    public async Task InvokeAsync_WhenUnhandledExceptionThrown_ShouldReturn500WithSafeSystemMessage()
    {
        var unhandledEx = new NullReferenceException("Internal sensitive stack error");

        var (statusCode, body) = await InvokeMiddlewareWithExceptionAsync(unhandledEx);

        statusCode.Should().Be(StatusCodes.Status500InternalServerError);
        body.RootElement.GetProperty("statusCode").GetInt32().Should().Be(500);
        body.RootElement.GetProperty("message").GetString().Should().Be("Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.");
    }
}
