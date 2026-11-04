import { useState } from "react";
import { useNavigate } from "react-router";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";
import {
  ForgotPasswordPage as DthuForgotPasswordPage,
  defaultAuthBrand,
} from "@/components/blocks/auth";
import { toast } from "@/components/ui/toaster";

export const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const handleSubmit = async (identifier: string) => {
    setSubmitting(true);
    setErrorMessage(undefined);
    try {
      await forgotPassword(identifier);
      navigate("/verify-otp", { state: { email: identifier } });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        const msg =
          resData?.message ||
          resData?.detail ||
          resData?.title ||
          "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại.";
        toast.error(msg);
      } else {
        toast.error("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      }
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (identifier: string) => {
    try {
      await forgotPassword(identifier);
      toast.success("Đã gửi lại liên kết đặt lại mật khẩu vào email của bạn.");
    } catch {
      toast.error("Không thể gửi lại liên kết. Vui lòng thử lại sau ít phút.");
    }
  };

  return (
    <DthuForgotPasswordPage
      {...defaultAuthBrand}
      submitting={submitting}
      error={errorMessage}
      onSubmit={handleSubmit}
      onResend={handleResend}
      onBack={() => navigate("/login")}
      onSupport={() => {
        toast.info(
          "Vui lòng liên hệ Văn phòng Đoàn - Hội Sinh viên ĐThU qua email doanhoi@dthu.edu.vn",
        );
      }}
    />
  );
};
