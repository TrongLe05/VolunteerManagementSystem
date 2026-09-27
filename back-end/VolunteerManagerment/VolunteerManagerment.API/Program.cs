using Scalar.AspNetCore;
using VolunteerManagerment.Application;
using VolunteerManagerment.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapGet("/api/test-db", async (VolunteerManagerment.Infrastructure.Persistence.ApplicationDbContext db) =>
{
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        if (canConnect)
        {
            var roleCount = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.CountAsync(db.
Roles);
            return Results.Ok(new
            {
                Status = "Thành công",
                Message = "Kết nối Supabase hoàn hảo!",
                TotalRolesInDb = roleCount
            });
        }
        return Results.Problem("Không thể kết nối tới Supabase.");
    }
    catch (Exception ex)
    {
        return Results.Problem($"Lỗi kết nối: {ex.Message} -> Inner: {ex.InnerException?.Message}");
    }
});

app.Run();
