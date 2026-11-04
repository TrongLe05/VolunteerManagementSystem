import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Award, MapPin, ScanFace, ShieldCheck } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";
import { LoginPage as DthuLoginPage } from "@/components/blocks/dashboard/login-page";
import { Logo } from "@/components/layout/Logo";

const features = [
  {
    icon: <MapPin />,
    title: "Điểm danh GPS Geofencing",
    description: "Kiểm soát tọa độ thực địa chuẩn xác",
  },
  {
    icon: <ScanFace />,
    title: "Xác thực khuôn mặt AI",
    description: "Chống gian lận theo Nghị định 13/2023/NĐ-CP",
  },
  {
    icon: <ShieldCheck />,
    title: "Tự động liên kết MSSV",
    description: "Đồng bộ dữ liệu hồ sơ đoàn viên sinh viên",
  },
  {
    icon: <Award />,
    title: "Ghi nhận thành tích số",
    description: "Tích lũy điểm rèn luyện và cấp chứng nhận",
  },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  const locationState = location.state as {
    from?: { pathname: string };
  };
  const from = locationState?.from?.pathname || "/";

  const handleLogin = async (data: {
    username: string;
    password: string;
    remember: boolean;
  }) => {
    setSubmitting(true);
    setErrorMessage(undefined);
    try {
      await login({
        usernameOrEmail: data.username,
        password: data.password,
      });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        const msg =
          resData?.message ||
          resData?.detail ||
          resData?.title ||
          "Tài khoản hoặc mật khẩu không chính xác.";
        setErrorMessage(msg);
      } else {
        setErrorMessage("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DthuLoginPage
      org="Trường Đại học Đồng Tháp"
      headline="Hệ thống Quản lý Hoạt động tình nguyện"
      description="Tuổi trẻ Đại học Đồng Tháp xung kích, tình nguyện vì cộng đồng."
      features={features}
      footer="© 2026 Đoàn Thanh niên - Hội Sinh viên Trường Đại học Đồng Tháp"
      brand={<Logo />}
      title="Đăng nhập"
      subtitle="Sử dụng tài khoản hoặc MSSV được cấp"
      submitting={submitting}
      error={errorMessage}
      onSubmit={handleLogin}
      onForgot={() => navigate("/forgot-password")}
      supportText="Chưa có tài khoản?"
      supportLinkLabel="Đăng ký tài khoản mới"
      onSupport={() => navigate("/register")}
      ssoLabel="Đăng nhập bằng Google"
      ssoIcon={<FcGoogle />}
    />
  );
}

export const Login = LoginPage;
