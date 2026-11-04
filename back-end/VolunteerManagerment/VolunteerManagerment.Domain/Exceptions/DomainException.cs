namespace VolunteerManagerment.Domain.Exceptions;

/// <summary>
/// Ngoại lệ biểu thị vi phạm quy tắc nghiệp vụ cốt lõi trong tầng Domain (DDD).
/// Kế thừa từ InvalidOperationException để tương thích ngược với tầng Application và Middleware hiện tại.
/// </summary>
public class DomainException : InvalidOperationException
{
    public DomainException(string message) : base(message)
    {
    }

    public DomainException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
