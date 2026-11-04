import * as React from "react"
import { Clock, LogOut, ShieldOff, TimerOff } from "lucide-react"
import { AuthLayout, AuthLink, AuthSubmit, type AuthBrandProps } from "./parts"

export type SignedOutReason = "signed-out" | "expired" | "idle" | "revoked"

export interface SignedOutPageProps extends AuthBrandProps {
  /** Why the session ended: chosen by the user, token expired, idle timeout, or revoked from another device / by an administrator. */
  reason?: SignedOutReason
  /** Override the default title / message of the reason. */
  title?: React.ReactNode
  message?: React.ReactNode
  /** Path the user will return to after signing in again (shown so they know nothing is lost). */
  returnTo?: string
  /** Primary action: go to the login screen. */
  onLogin?: () => void
  /** Secondary action, e.g. "Về trang chủ công khai". */
  onHome?: () => void
  homeLabel?: string
}

const preset = {
  "signed-out": { icon: <LogOut />, tone: "success", title: "Bạn đã đăng xuất", message: "Phiên làm việc đã kết thúc an toàn. Nếu dùng máy chung, hãy đóng cửa sổ trình duyệt." },
  expired: { icon: <TimerOff />, tone: "warning", title: "Phiên đăng nhập đã hết hạn", message: "Vì lý do bảo mật, bạn cần đăng nhập lại để tiếp tục." },
  idle: { icon: <Clock />, tone: "warning", title: "Đã đăng xuất do không hoạt động", message: "Hệ thống tự đăng xuất sau một thời gian không thao tác để bảo vệ tài khoản của bạn." },
  revoked: { icon: <ShieldOff />, tone: "destructive", title: "Phiên đã bị thu hồi", message: "Tài khoản được đăng xuất từ thiết bị khác hoặc bởi quản trị viên. Nếu không phải bạn, hãy đổi mật khẩu ngay sau khi đăng nhập." },
} as const

/** End-of-session screen: signed out, session expired, idle timeout or revoked. Always offers a way back to login. */
export function SignedOutPage({ reason = "signed-out", title, message, returnTo, onLogin, onHome, homeLabel = "Về trang chủ", ...brand }: SignedOutPageProps) {
  const p = preset[reason]
  return (
    <AuthLayout {...brand} icon={p.icon} tone={p.tone} title={title ?? p.title} subtitle={message ?? p.message}>
      <div className="grid gap-3.5">
        {returnTo && reason !== "signed-out" && <p className="m-0 rounded-md bg-secondary px-3 py-2 text-small text-muted-foreground">Sau khi đăng nhập bạn sẽ quay lại <code className="font-mono text-foreground">{returnTo}</code>.</p>}
        <AuthSubmit type="button" onClick={onLogin}>Đăng nhập lại</AuthSubmit>
        {onHome && <div className="text-center"><AuthLink onClick={onHome}>{homeLabel}</AuthLink></div>}
      </div>
    </AuthLayout>
  )
}
