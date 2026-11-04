"use client"

// @dthu/ui 0.2.0 · block-auth
import * as React from "react"
import { Lock, ShieldAlert } from "lucide-react"
import { AuthError, AuthField, AuthLayout, AuthLink, AuthSubmit, PasswordStrength, defaultPasswordRules, evaluatePassword, type AuthBrandProps, type PasswordRule } from "./parts"

export interface ChangePasswordValues { current: string; password: string }
export interface ChangePasswordFormProps {
  rules?: PasswordRule[]
  submitting?: boolean
  error?: string
  submitLabel?: string
  className?: string
  onSubmit?: (v: ChangePasswordValues) => void
}

/** The three fields of "Đổi mật khẩu" (current, new, confirm) with live strength. Embed it in a dialog, a settings card or `ChangePasswordPage`. */
export function ChangePasswordForm({ rules = defaultPasswordRules, submitting, error, submitLabel = "Đổi mật khẩu", className, onSubmit }: ChangePasswordFormProps) {
  const [current, setCurrent] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirm, setConfirm] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  const ok = evaluatePassword(password, rules).valid
  const currentErr = touched && !current ? "Vui lòng nhập mật khẩu hiện tại" : undefined
  const passErr = touched && !currentErr && !ok ? "Mật khẩu chưa đạt đủ yêu cầu bên dưới" : touched && password && password === current ? "Mật khẩu mới phải khác mật khẩu hiện tại" : undefined
  const confirmErr = touched && confirm !== password ? "Mật khẩu nhập lại không khớp" : undefined
  return (
    <form noValidate className={className ?? "grid gap-[15px]"} onSubmit={(e) => { e.preventDefault(); setTouched(true); if (!current || !ok || password === current || confirm !== password) return; onSubmit?.({ current, password }) }}>
      <AuthError>{error}</AuthError>
      <AuthField id="chpw-current" type="password" label="Mật khẩu hiện tại" icon={<Lock />} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} error={currentErr} />
      <AuthField id="chpw-new" type="password" label="Mật khẩu mới" icon={<Lock />} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={passErr} />
      <PasswordStrength password={password} rules={rules} />
      <AuthField id="chpw-confirm" type="password" label="Nhập lại mật khẩu mới" icon={<Lock />} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={confirmErr} />
      <AuthSubmit disabled={submitting}>{submitting ? "Đang lưu..." : submitLabel}</AuthSubmit>
    </form>
  )
}

export interface ChangePasswordPageProps extends AuthBrandProps, Omit<ChangePasswordFormProps, "className" | "submitLabel"> {
  /** Why the change is required. `first-login` and `expired` cannot be skipped; `reset` is after an administrator reset. */
  reason?: "first-login" | "expired" | "reset"
  username?: string
  onSignOut?: () => void
}

const reasonText = {
  "first-login": "Đây là lần đăng nhập đầu tiên. Hãy đổi mật khẩu được cấp để tiếp tục.",
  expired: "Mật khẩu của bạn đã hết hạn theo chính sách bảo mật. Hãy đặt mật khẩu mới để tiếp tục.",
  reset: "Quản trị viên đã đặt lại mật khẩu của bạn. Hãy đổi sang mật khẩu của riêng bạn để tiếp tục.",
} as const

/** Full-page "Đổi mật khẩu" that blocks the app until done: first login, expired password or administrator reset. */
export function ChangePasswordPage({ reason = "first-login", username, onSignOut, rules, submitting, error, onSubmit, ...brand }: ChangePasswordPageProps) {
  return (
    <AuthLayout {...brand} icon={<ShieldAlert />} tone="warning" title="Đổi mật khẩu bắt buộc" subtitle={<>{username ? <>Tài khoản <b className="font-semibold text-foreground">{username}</b>. </> : null}{reasonText[reason]}</>}>
      <div className="grid gap-[15px]">
        <ChangePasswordForm rules={rules} submitting={submitting} error={error} onSubmit={onSubmit} submitLabel="Đổi mật khẩu và tiếp tục" />
        {onSignOut && <div className="text-center"><AuthLink onClick={onSignOut}>Đăng xuất</AuthLink></div>}
      </div>
    </AuthLayout>
  )
}
