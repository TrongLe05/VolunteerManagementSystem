using MiniExcelLibs;
using VolunteerManagerment.Application.Common.Interfaces;

namespace VolunteerManagerment.Infrastructure.Services;

public class MiniExcelService : IExcelService
{
    public async Task<List<T>> ReadAsync<T>(Stream stream, CancellationToken cancellationToken = default) where T : class, new()
    {
        var rows = await stream.QueryAsync<T>(cancellationToken: cancellationToken);
        return rows.ToList();
    }
}
