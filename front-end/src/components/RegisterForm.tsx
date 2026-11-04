import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { AtSign, Building2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import axios from "axios";

import { useAuth } from "@/context/AuthContext";
import { organizationApi } from "@/api/organizationApi";
import type { Organization } from "@/types/auth.types";
import { usePasswordStrength } from "@/hooks/usePasswordStrength";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/layout/Logo";
import { toast } from "./ui/toaster";

const field = "relative flex items-center";
const input =
  "h-[44px] w-full rounded-[9px] border border-[#d1dbe6] bg-white pr-10 pl-[38px] text-body text-[#16232f] outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-muted-foreground focus:border-primary focus:shadow-focus-field aria-invalid:border-[#d33d4d] dark:border-border dark:bg-card dark:text-foreground";
const linkStyle =
  "cursor-pointer border-0 bg-transparent p-0 text-control font-medium text-primary hover:underline";

export function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullname, setFullname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organization, setOrganization] = useState<Organization | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const { score, labelPassword, labelConfirmPassword, isMatch } =
    usePasswordStrength(password, confirmPassword);

  useEffect(() => {
    organizationApi
      .getAll()
      .then((data) => {
        setOrganizations(data);
      })
      .catch(() => {
        toast.error("Không thể tải danh sách tổ chức Đoàn - Hội.");
      });
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      return;
    }

    if (!organization) {
      toast.error("Vui lòng chọn đơn vị Đoàn - Hội trực thuộc.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu và xác nhận mật khẩu không khớp.");
      return;
    }

    if (score < 2) {
      toast.error("Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password,
        organizationId: organization.id,
      });

      navigate("/login", {
        state: { registeredEmail: email },
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        const msg =
          resData?.message ||
          resData?.detail ||
          resData?.title ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.";
        toast.error(msg);
      } else {
        toast.error("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const usernameErr =
    touched && !username.trim() ? "Vui lòng nhập tên đăng nhập" : undefined;
  const emailErr = touched && !email.trim() ? "Vui lòng nhập email" : undefined;
  const passErr = touched && !password ? "Vui lòng nhập mật khẩu" : undefined;
  const confirmErr =
    touched && (!confirmPassword || !isMatch)
      ? "Mật khẩu xác nhận không khớp"
      : undefined;

  return (
    <div className="w-full max-w-[420px] max-lg:max-w-[440px] max-lg:rounded-[14px] max-lg:bg-background max-lg:px-[30px] max-lg:pt-8 max-lg:pb-[26px] max-lg:shadow-[0_1px_2px_rgba(0,14,28,0.1),0_12px_26px_-8px_rgba(0,14,28,0.3),0_32px_64px_-24px_rgba(0,14,28,0.34)] max-sm:px-[22px] max-sm:pt-[26px] max-sm:pb-[22px]">
      {/* Logo Header */}
      <div className="mb-[20px] flex items-center gap-3 border-b border-border pb-4 max-lg:mb-4 max-lg:pb-[14px]">
        <Logo />
      </div>

      <h2 className="m-0 text-[24px] font-bold tracking-[-0.01em]">
        Tạo tài khoản mới
      </h2>
      <p className="m-0 mt-[3px] text-sm text-muted-foreground dark:text-muted-foreground">
        Đăng ký tham gia phong trào Tình nguyện viên DThU
      </p>

      <form className="mt-5 grid gap-3.5" noValidate onSubmit={onSubmit}>
        {/* Họ và tên */}
        <div>
          <label
            htmlFor="register-fullname"
            className="mb-1 block text-body font-semibold text-[#33475b] dark:text-foreground"
          >
            Họ và tên sinh viên
          </label>
          <div className={field}>
            <User
              aria-hidden
              className="pointer-events-none absolute left-[12px] size-[18px] text-muted-foreground"
            />
            <input
              id="register-fullname"
              className={input}
              type="text"
              placeholder="VD: Lê Minh Trọng"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Tên đăng nhập */}
        <div>
          <label
            htmlFor="register-username"
            className="mb-1 block text-body font-semibold text-[#33475b] dark:text-foreground"
          >
            Tên đăng nhập <span className="text-destructive">*</span>
          </label>
          <div className={field}>
            <AtSign
              aria-hidden
              className="pointer-events-none absolute left-[12px] size-[18px] text-muted-foreground"
            />
            <input
              id="register-username"
              className={input}
              type="text"
              autoComplete="username"
              placeholder="VD: minhtrong2026"
              value={username}
              aria-invalid={usernameErr ? true : undefined}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          {usernameErr && (
            <p role="alert" className="m-0 mt-1 text-xs text-destructive">
              {usernameErr}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="register-email"
            className="mb-1 block text-body font-semibold text-[#33475b] dark:text-foreground"
          >
            Địa chỉ Email <span className="text-destructive">*</span>
          </label>
          <div className={field}>
            <Mail
              aria-hidden
              className="pointer-events-none absolute left-[12px] size-[18px] text-muted-foreground"
            />
            <input
              id="register-email"
              className={input}
              type="email"
              autoComplete="email"
              placeholder="VD: sv_dthu@dthu.edu.vn"
              value={email}
              aria-invalid={emailErr ? true : undefined}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          {emailErr && (
            <p role="alert" className="m-0 mt-1 text-xs text-destructive">
              {emailErr}
            </p>
          )}
        </div>

        {/* Đơn vị Đoàn - Hội */}
        <div>
          <label className="mb-1 block text-body font-semibold text-[#33475b] dark:text-foreground">
            Đơn vị Đoàn - Hội trực thuộc{" "}
            <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Combobox<Organization>
              items={organizations}
              value={organization}
              onValueChange={(selOrg) => setOrganization(selOrg)}
              itemToStringValue={(org) => String(org.id)}
              itemToStringLabel={(org) => org.name}
            >
              <ComboboxInput
                placeholder="Chọn khoa / đơn vị trực thuộc..."
                className="h-[44px] rounded-[9px] border-[#d1dbe6] pl-9"
              />
              <Building2
                aria-hidden
                className="pointer-events-none absolute left-[12px] top-3.5 size-[18px] text-muted-foreground z-10"
              />
              <ComboboxContent>
                <ComboboxEmpty>Không có đơn vị nào.</ComboboxEmpty>
                <ComboboxList>
                  {(org: Organization) => (
                    <ComboboxItem
                      key={org.id}
                      value={org}
                      disabled={isSubmitting}
                    >
                      {org.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>

        {/* Mật khẩu */}
        <div>
          <label
            htmlFor="register-password"
            className="mb-1 block text-body font-semibold text-[#33475b] dark:text-foreground"
          >
            Mật khẩu <span className="text-destructive">*</span>
          </label>
          <div className={field}>
            <Lock
              aria-hidden
              className="pointer-events-none absolute left-[12px] size-[18px] text-muted-foreground"
            />
            <input
              id="register-password"
              className={input}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Tối thiểu 6 ký tự..."
              value={password}
              aria-invalid={passErr ? true : undefined}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-1.5 grid size-[34px] cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent p-0 text-muted-foreground outline-none hover:bg-[rgba(127,153,178,0.14)]"
            >
              {showPassword ? (
                <EyeOff className="size-[18px]" />
              ) : (
                <Eye className="size-[18px]" />
              )}
            </button>
          </div>
          {password && (
            <div className="mt-1.5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Độ mạnh mật khẩu:</span>
                <span className="font-semibold text-primary">
                  {labelPassword}
                </span>
              </div>
              <Progress
                value={(score / 4) * 100}
                tone={
                  score <= 1
                    ? "destructive"
                    : score === 2
                      ? "warning"
                      : "success"
                }
                className="h-1.5"
              />
            </div>
          )}
        </div>

        {/* Nhập lại mật khẩu */}
        <div>
          <label
            htmlFor="register-confirm-password"
            className="mb-1 block text-body font-semibold text-[#33475b] dark:text-foreground"
          >
            Xác nhận mật khẩu <span className="text-destructive">*</span>
          </label>
          <div className={field}>
            <Lock
              aria-hidden
              className="pointer-events-none absolute left-[12px] size-[18px] text-muted-foreground"
            />
            <input
              id="register-confirm-password"
              className={input}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu vừa đặt"
              value={confirmPassword}
              aria-invalid={confirmErr ? true : undefined}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowConfirmPassword((s) => !s)}
              className="absolute right-1.5 grid size-[34px] cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent p-0 text-muted-foreground outline-none hover:bg-[rgba(127,153,178,0.14)]"
            >
              {showConfirmPassword ? (
                <EyeOff className="size-[18px]" />
              ) : (
                <Eye className="size-[18px]" />
              )}
            </button>
          </div>
          {confirmPassword && (
            <p
              className={`m-0 mt-1 text-xs font-medium ${
                isMatch ? "text-success" : "text-destructive"
              }`}
            >
              {labelConfirmPassword}
            </p>
          )}
        </div>

        {/* Nút Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex h-[46px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-transparent bg-primary text-lead font-semibold text-primary-foreground transition-colors duration-[130ms] hover:enabled:bg-[#004572] disabled:cursor-not-allowed disabled:opacity-[0.62]"
        >
          {isSubmitting ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>

        {/* Link đăng nhập */}
        <p className="m-0 mt-2 text-center text-body text-muted-foreground dark:text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link to="/login" className={linkStyle}>
            Đăng nhập ngay
          </Link>
        </p>
      </form>
    </div>
  );
}
