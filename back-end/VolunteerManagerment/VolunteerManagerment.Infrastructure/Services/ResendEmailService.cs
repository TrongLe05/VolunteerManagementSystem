using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Resend;
using VolunteerManagerment.Application.Common.Interfaces;

namespace VolunteerManagerment.Infrastructure.Services;

public class ResendEmailService(
    IResend resend,
    IConfiguration configuration,
    ILogger<ResendEmailService> logger
) : IEmailService
{
    public async Task SendPasswordResetEmailAsync(string toEmail, string resetCode, CancellationToken cancellationToken = default)
    {
        try
        {
            var message = new EmailMessage
            {
                From = "Volunteer System <onboarding@resend.dev>",
                To = { toEmail },
                Subject = "[Volunteer System] Mã xác nhận đặt lại mật khẩu",
                HtmlBody = $"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  
                            <h2 style="color: #2563eb; text-align: center;">HỆ THỐNG QUẢN LÝ TÌNH NGUYỆN</h2>
                            <p>Xin chào,</p>
                            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này.</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px dashed #94a3b8;">
                                    {resetCode}
                                </span>
                            </div>
                            <p style="color: #64748b; font-size: 14px;">Mã OTP này có hiệu lực trong vòng <strong>15 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
                            <p style="color: #64748b; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                            <p style="text-align: center; color: #94a3b8; font-size: 12px;">© 2026 Volunteer Management System. All rights reserved.</p>
                        </div>
                    """
            };

            await resend.EmailSendAsync(message, cancellationToken);
            logger.LogInformation("Đã gửi email OTP thành công tới: {Email}", toEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Lỗi khi gửi email OTP tới: {Email}", toEmail);

        }
    }
}