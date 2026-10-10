namespace VolunteerManagerment.Application.Features.Volunteers.DTOs;

public record ImportVolunteersResultDto(
    int TotalRows,
    int SuccessfulImports,
    int FailedImports,
    List<string> Error
);
