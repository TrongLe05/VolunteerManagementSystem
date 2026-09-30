using MediatR;

namespace VolunteerManagerment.Application.Features.Auth.Commands.ResetPassword;

public record ResetPasswordCommand(
    string Email,
    string Otp,
    string NewPassword,
    string ConfirmNewPassword
) : IRequest<bool>;
