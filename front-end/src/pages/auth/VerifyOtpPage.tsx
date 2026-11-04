import {
  defaultAuthBrand as brand,
  OtpVerifyPage,
} from "@/components/blocks/auth";
import { toast } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router";

export const VerifyOtpPage = () => {
  const location = useLocation();
  const navigation = useNavigate();
  const { verifyOtp, forgotPassword } = useAuth();

  const email = location.state?.email || "";

  const [submitting, setSubmitting] = useState(false);

  const verify = async ({ code }: { code: string; trustDevice: boolean }) => {
    setSubmitting(true);
    try {
      await verifyOtp(email, code);
      toast.success("Xác thực OTP thành công!");
      navigation("/change-password", {
        state: { email, otp: code, isVerifying: true },
      });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        const msg =
          resData?.message ||
          resData?.detail ||
          resData?.title ||
          "Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.";
        toast.error(msg);
      } else {
        toast.error("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resendOtp = async () => {
    try {
      await forgotPassword(email);
      toast.success("Mã OTP đã được gửi lại. Vui lòng kiểm tra email của bạn.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        const msg =
          resData?.message ||
          resData?.detail ||
          resData?.title ||
          "Không thể gửi lại mã OTP. Vui lòng thử lại sau.";
        toast.error(msg);
      } else {
        toast.error("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      }
    }
  };

  return (
    <OtpVerifyPage
      {...brand}
      method="email"
      length={6}
      target={email}
      allowTrustDevice
      submitting={submitting}
      onSubmit={verify}
      onResend={resendOtp}
      onBack={() => navigation("/forgot-password")}
    />
  );
};
