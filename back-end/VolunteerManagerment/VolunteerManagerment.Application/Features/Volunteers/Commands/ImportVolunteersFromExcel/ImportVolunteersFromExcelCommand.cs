using MediatR;
using VolunteerManagerment.Application.Features.Volunteers.DTOs;

namespace VolunteerManagerment.Application.Features.Volunteers.Commands.ImportVolunteersFromExcel;

public record ImportVolunteersFromExcelCommand(
    Stream FileStream,
    string FileName,
    Guid OrganizationId
) : IRequest<ImportVolunteersResultDto>;
