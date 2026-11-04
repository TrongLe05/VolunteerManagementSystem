import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import axios from "axios";

import {
  defaultAuthBrand,
  ResetPasswordPage as DthuResetPasswordPage,
} from "@/components/blocks/auth";
import { toast } from "@/components/ui/toaster";
import { useAuth } from "@/context/AuthContext";

export const ChangePasswordPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuth();

  // Nhận email và mã OTP từ location.state (chuyển tiếp từ VerifyOtpPage)
  // hoặc từ URL query params (?email=...&token=... hoặc ?otp=...)
  const state = location.state as {
    email?: string;
    otp?: string;
    isVerifying?: boolean;
  } | null;

  const email = state?.email || searchParams.get("email") || "";
  const otp =
    state?.otp || searchParams.get("token") || searchParams.get("otp") || "";

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [done, setDone] = useState(false);

  // Nếu không có OTP/code thì coi như tokenState không hợp lệ
  const tokenState = !otp ? "invalid" : "valid";

  // Xử lý gửi mật khẩu mới lên server
  const handleReset = async ({ password }: { password: string }) => {
    if (!email || !otp) {
      toast.error(
        "Thiếu thông tin email hoặc mã OTP xác thực. Vui lòng thử lại từ đầu.",
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(undefined);
    try {
      // Backend yêu cầu cả NewPassword và ConfirmNewPassword
      await resetPassword(email, otp, password, password);

      toast.success("Đặt lại mật khẩu thành công!");
      setDone(true); // Hiển thị màn hình thành công của DThU ResetPasswordPage
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        const msg =
          resData?.message ||
          resData?.detail ||
          resData?.title ||
          "Mã xác thực đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu mã mới.";
        toast.error(msg);
      } else {
        const msg = "Lỗi kết nối máy chủ. Vui lòng thử lại sau.";
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DthuResetPasswordPage
      {...defaultAuthBrand}
      tokenState={tokenState}
      username={email}
      submitting={submitting}
      error={errorMessage}
      done={done}
      onSubmit={handleReset}
      onLogin={() => navigate("/login", { state: { registeredEmail: email } })}
      onRequestNewLink={() => navigate("/forgot-password")}
    />
  );
};
