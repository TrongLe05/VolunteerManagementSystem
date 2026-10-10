namespace VolunteerManagerment.Application.Common.Interfaces;

public interface IExcelService
{
    Task<List<T>> ReadAsync<T>(Stream stream, CancellationToken cancellationToken = default) where T : class, new();
}
