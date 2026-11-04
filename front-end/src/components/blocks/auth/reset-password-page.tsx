import * as React from "react";
import { CircleCheck, Link2Off, Lock, LockKeyhole } from "lucide-react";
import {
  AuthError,
  AuthField,
  AuthLayout,
  AuthLink,
  AuthSubmit,
  PasswordStrength,
  defaultPasswordRules,
  evaluatePassword,
  type AuthBrandProps,
  type PasswordRule,
} from "./parts";

export interface ResetPasswordPageProps extends AuthBrandProps {
  /** State of the link the user came from. `expired` / `invalid` show a "request a new link" screen instead of the form. */
  tokenState?: "valid" | "expired" | "invalid";
  /** Account the password is being reset for (shown under the title). */
  username?: string;
  /** Policy; defaults to `defaultPasswordRules`. Keep it equal to what the server enforces. */
  rules?: PasswordRule[];
  submitting?: boolean;
  error?: string;
  /** Set after the server accepted the new password: shows the success screen. */
  done?: boolean;
  onSubmit?: (v: { password: string }) => void;
  onLogin?: () => void;
  onRequestNewLink?: () => void;
}

/** Reset-password screen reached from the emailed link: new password + confirmation with live strength, plus the expired-link and success states. */
export function ResetPasswordPage({
  tokenState = "valid",
  username,
  rules = defaultPasswordRules,
  submitting,
  error,
  done,
  onSubmit,
  onLogin,
  onRequestNewLink,
  ...brand
}: ResetPasswordPageProps) {
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [touched, setTouched] = React.useState(false);
  const ok = evaluatePassword(password, rules).valid;
  const passErr =
    touched && !ok ? "Mật khẩu chưa đạt đủ yêu cầu bên dưới" : undefined;
  const confirmErr =
    touched && confirm !== password
      ? "Mật khẩu nhập lại không khớp"
      : undefined;

  if (done) {
    return (
      <AuthLayout
        {...brand}
        icon={<CircleCheck />}
        tone="success"
        title="Đã đặt lại mật khẩu"
        subtitle="Bạn có thể đăng nhập bằng mật khẩu mới. Các phiên đăng nhập cũ đã bị đăng xuất."
      >
        <AuthSubmit type="button" onClick={onLogin}>
          Đăng nhập
        </AuthSubmit>
      </AuthLayout>
    );
  }
  if (tokenState !== "valid") {
    return (
      <AuthLayout
        {...brand}
        icon={<Link2Off />}
        tone="warning"
        title={
          tokenState === "expired"
            ? "Liên kết đã hết hạn"
            : "Liên kết không hợp lệ"
        }
        subtitle={
          tokenState === "expired"
            ? "Liên kết đặt lại mật khẩu chỉ dùng được trong thời gian ngắn và một lần."
            : "Liên kết này sai hoặc đã được dùng. Hãy yêu cầu một liên kết mới."
        }
      >
        <div className="grid gap-3.5">
          <AuthSubmit type="button" onClick={onRequestNewLink}>
            Yêu cầu liên kết mới
          </AuthSubmit>
          <div className="text-center">
            <AuthLink onClick={onLogin}>Quay lại đăng nhập</AuthLink>
          </div>
        </div>
      </AuthLayout>
    );
  }
  return (
    <AuthLayout
      {...brand}
      icon={<LockKeyhole />}
      title="Đặt mật khẩu mới"
      subtitle={
        username ? (
          <>
            Tài khoản{" "}
            <b className="font-semibold text-foreground">{username}</b>
          </>
        ) : (
          "Chọn mật khẩu mạnh mà bạn chưa dùng ở nơi khác."
        )
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (!ok || confirm !== password) return;
          onSubmit?.({ password });
        }}
        className="grid gap-[15px]"
      >
        <AuthError>{error}</AuthError>
        <AuthField
          id="reset-password"
          type="password"
          label="Mật khẩu mới"
          icon={<Lock />}
          autoComplete="new-password"
          placeholder="Nhập mật khẩu mới"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={passErr}
        />
        <PasswordStrength password={password} rules={rules} />
        <AuthField
          id="reset-confirm"
          type="password"
          label="Nhập lại mật khẩu"
          icon={<Lock />}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu mới"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={confirmErr}
        />
        <AuthSubmit disabled={submitting}>
          {submitting ? "Đang lưu..." : "Đặt lại mật khẩu"}
        </AuthSubmit>
      </form>
    </AuthLayout>
  );
}
