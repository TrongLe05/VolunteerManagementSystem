using MediatR;

namespace VolunteerManagerment.Application.Features.Auth.Commands.VerifyOtp;

public record VerifyOtpCommand(string Email, string Otp) : IRequest<bool>;
