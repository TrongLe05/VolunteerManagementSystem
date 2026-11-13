namespace VolunteerManagerment.Application.Features.Volunteers.DTOs;

public record VolunteerCreditRecordDto(
    Guid Id,
    Guid? ActivityId,
    string? ActivityName,
    Guid? ActivityRegistrationId,
    decimal CreditDays,
    string RecordType,
    DateTimeOffset AwardedAt,
    Guid? AwardedBy,
    string? AwardedByName,
    string? Reason,
    string Status
);

public record VolunteerCreditSummaryDto(
    Guid VolunteerId,
    string FullName,
    string? StudentCode,
    decimal TotalCreditDays,
    int TotalOfficialRecords,
    List<VolunteerCreditRecordDto> Records
);
