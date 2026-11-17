import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Award, Building2, MapPin, ScanFace, ShieldCheck } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";
import { LoginPage as DthuLoginPage } from "@/components/blocks/dashboard/login-page";
import { Logo } from "@/components/layout/Logo";
import type { Organization } from "@/types/auth.types";
import { organizationApi } from "@/api/organizationApi";
import { toast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GoogleLogin } from "@react-oauth/google";

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
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );

  // State phục vụ Kịch bản 2: Lần đầu đăng nhập bằng Google cần chọn Tổ chức
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [pendingIdToken, setPendingIdToken] = useState<string | null>(null);
  const [googleUserInfo, setGoogleUserInfo] = useState<{
    email?: string | null;
    fullName?: string | null;
  }>({});
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const locationState = location.state as {
    from?: { pathname: string };
  };
  const from = locationState?.from?.pathname || "/";

  // Tải danh sách Đơn vị Đoàn khi mở Popup chọn Tổ chức
  useEffect(() => {
    if (orgModalOpen && organizations.length === 0) {
      organizationApi
        .getAll()
        .then((data) => setOrganizations(data.filter((o) => o.isActive)))
        .catch(() => toast.error("Không thể tải danh sách đơn vị Đoàn - Hội."));
    }
  }, [orgModalOpen, organizations.length]);

  // GỌI LẦN 1: Khi người dùng chọn tài khoản Google xong
  const handleGoogleSuccess = async (credential?: string) => {
    if (!credential) {
      toast.error("Không nhận được thông tin xác thực từ Google.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(undefined);
    try {
      const result = await loginWithGoogle({ idToken: credential });

      if (result.requiresOrganization) {
        // Tài khoản mới -> Mở Popup chọn Đơn vị Đoàn
        setPendingIdToken(credential);
        setGoogleUserInfo({
          email: result.email,
          fullName: result.fullName,
        });
        setOrgModalOpen(true);
      } else {
        // Tài khoản đã có -> Vào thẳng hệ thống
        toast.success("Đăng nhập bằng Google thành công!");
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        setErrorMessage(
          resData?.message ||
            resData?.detail ||
            "Đăng nhập Google thất bại. Vui lòng thử lại.",
        );
      } else {
        setErrorMessage("Lỗi kết nối máy chủ khi đăng nhập Google.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // GỌI LẦN 2: Khi người dùng mới chọn xong Tổ chức trên Popup và bấm "Hoàn tất"
  const handleConfirmOrganization = async () => {
    if (!pendingIdToken || !selectedOrgId) {
      toast.error("Vui lòng chọn đơn vị Đoàn - Hội trực thuộc.");
      return;
    }

    setSubmitting(true);
    try {
      await loginWithGoogle({
        idToken: pendingIdToken,
        organizationId: selectedOrgId,
      });
      setOrgModalOpen(false);
      toast.success("Tạo tài khoản và đăng nhập thành công!");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        toast.error(
          resData?.message ||
            resData?.detail ||
            "Không thể hoàn tất đăng ký tài khoản Google.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

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
    <>
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
        ssoSlot={
          <GoogleLogin
            onSuccess={(credentialResponse) =>
              handleGoogleSuccess(credentialResponse.credential)
            }
            onError={() =>
              setErrorMessage("Đăng nhập bằng Google không thành công.")
            }
            width="384"
            text="signin_with"
            shape="pill"
            size="large"
          />
        }
      />

      {/* Popup chọn Đơn vị Đoàn cho người dùng đăng nhập Google lần đầu */}
      <Dialog open={orgModalOpen} onOpenChange={setOrgModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              Chọn đơn vị Đoàn - Hội trực thuộc
            </DialogTitle>
            <DialogDescription>
              Xin chào{" "}
              <strong className="text-foreground">
                {googleUserInfo.fullName || googleUserInfo.email}
              </strong>
              ! Vì đây là lần đầu bạn đăng nhập bằng Google, vui lòng chọn đơn
              vị trực thuộc để hoàn tất hồ sơ tình nguyện viên.
            </DialogDescription>
          </DialogHeader>

          <div className="py-3">
            <label className="mb-2 block text-sm font-medium">
              Đơn vị Đoàn - Hội <span className="text-destructive">*</span>
            </label>
            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Chọn Khoa / Liên chi Đoàn --" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOrgModalOpen(false)}
              disabled={submitting}
            >
              Huỷ
            </Button>
            <Button
              onClick={handleConfirmOrganization}
              disabled={!selectedOrgId || submitting}
            >
              {submitting ? "Đang xử lý..." : "Hoàn tất đăng nhập"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export const Login = LoginPage;
