import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLocation, useNavigate } from "react-router";

import { toast } from "@/components/ui/toaster";
import axios from "axios";
import { OtpVerifyPage } from "./blocks/auth";
import { defaultAuthBrand as brand } from "@/components/blocks/auth";

export const VerifyOtpForm = () => {
  const location = useLocation();
  const navigation = useNavigate();
  const { verifyOtp, forgotPassword } = useAuth();

  const email = location.state?.email || "";
  const [isVerifying, setIsVerifying] = useState(false);

  const verify = async ({ code }: { code: string; trustDevice: boolean }) => {
    try {
      setIsVerifying(true);
      await verifyOtp(email, code);
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
      }
    } finally {
      setIsVerifying(false);
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
      }
    }
  };

  return (
    <OtpVerifyPage
      {...brand}
      method="email"
      target={email}
      allowTrustDevice
      submitting={isVerifying}
      onSubmit={verify}
      onResend={resendOtp}
    />
  );
};
