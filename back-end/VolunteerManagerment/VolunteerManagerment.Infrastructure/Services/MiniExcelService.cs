using MiniExcelLibs;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using VolunteerManagerment.Application.Common.Interfaces;

namespace VolunteerManagerment.Infrastructure.Services;

public class MiniExcelService : IExcelService
{
    public async Task<List<T>> ReadAsync<T>(Stream stream, CancellationToken cancellationToken = default) where T : class, new()
    {
        var rawRows = await stream.QueryAsync(useHeaderRow: true, cancellationToken: cancellationToken);
        var result = new List<T>();
        var properties = typeof(T).GetProperties(BindingFlags.Public | BindingFlags.Instance)
            .Where(p => p.CanWrite)
            .ToList();

        foreach (var rawRow in rawRows)
        {
            if (rawRow is not IDictionary<string, object> dict) continue;

            var item = new T();
            foreach (var kvp in dict)
            {
                if (kvp.Value == null || string.IsNullOrWhiteSpace(kvp.Key)) continue;

                var normalizedKey = NormalizeHeader(kvp.Key);
                var stringValue = kvp.Value.ToString()?.Trim();

                foreach (var prop in properties)
                {
                    var normalizedPropName = NormalizeHeader(prop.Name);
                    if (normalizedKey.Equals(normalizedPropName, StringComparison.OrdinalIgnoreCase))
                    {
                        prop.SetValue(item, stringValue);
                    }
                }
            }
            result.Add(item);
        }

        return result;
    }

    private static string NormalizeHeader(string header)
    {
        if (string.IsNullOrWhiteSpace(header)) return string.Empty;

        // 1. Chuyển Unicode sang FormD để tách dấu
        var normalized = header.Trim().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();

        foreach (var c in normalized)
        {
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                sb.Append(c);
            }
        }

        var withoutDiacritics = sb.ToString().Normalize(NormalizationForm.FormC);

        // Thay đ / Đ
        withoutDiacritics = withoutDiacritics.Replace("đ", "d").Replace("Đ", "D");

        // 2. Xóa tất cả ký tự không phải chữ và số (dấu cách, gạch dưới, chấm, ngoặc...)
        return Regex.Replace(withoutDiacritics, @"[^a-zA-Z0-9]", "").ToLowerInvariant();
    }
}
