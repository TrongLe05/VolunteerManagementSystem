using System.Net;
using System.Text.Json;
using FluentValidation;

namespace VolunteerManagerment.API.Middlewares;

public class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger
)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Đã xảy ra lỗi: {Message}.", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    public static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        var (statusCode, message, errors) = exception
        switch
        {
            ValidationException validationEx => (
                StatusCodes.Status400BadRequest,
                "Dữ liệu đầu vào không hợp lệ.",
                validationEx.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(
                        g => g.Key,
                        g => g.Select(e => e.ErrorMessage).ToArray()
                    )
            ),
            InvalidOperationException invalidOpEx => (
                StatusCodes.Status400BadRequest,
                invalidOpEx.Message,
                null
            ),
            ArgumentException argEx => (
                StatusCodes.Status400BadRequest,
                argEx.Message,
                null
            ),
            UnauthorizedAccessException unauthorizedEx => (
                StatusCodes.Status401Unauthorized,
                unauthorizedEx.Message,
                null
            ),
            KeyNotFoundException keyNotFoundEx => (
                StatusCodes.Status404NotFound,
                keyNotFoundEx.Message,
                null
            ),
            _ => (
                StatusCodes.Status500InternalServerError,
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.",
                null
            )
        };

        context.Response.StatusCode = statusCode;

        var reponse = new
        {
            StatusCode = statusCode,
            Message = message,
            Errors = errors
        };
        await context.Response.WriteAsJsonAsync(reponse);
    }
}
