"use client"

// @dthu/ui 0.2.0 · block-auth
import * as React from "react"
import { KeyRound, Laptop, LogOut, Monitor, ShieldCheck, Smartphone } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ChangePasswordForm, type ChangePasswordFormProps, type ChangePasswordValues } from "./change-password"

export interface SecuritySession { id: string; device: string; kind?: "desktop" | "mobile"; location?: string; ip?: string; lastActive: string; current?: boolean }

export interface SecuritySettingsProps {
  /** Text such as "3 tháng trước"; shown under the password row. */
  passwordChangedAt?: string
  /** Policy / submit state forwarded to the change-password dialog. */
  passwordRules?: ChangePasswordFormProps["rules"]
  passwordSubmitting?: boolean
  passwordError?: string
  onChangePassword?: (v: ChangePasswordValues) => void
  twoFactor?: { enabled: boolean; method?: string }
  /** Called with the wanted state; the app should run its own enrol / disable flow and then update `twoFactor`. */
  onTwoFactorChange?: (enabled: boolean) => void
  sessions?: SecuritySession[]
  onRevokeSession?: (id: string) => void
  /** Sign out every session except the current one. */
  onRevokeOthers?: () => void
  className?: string
}

/**
 * "Bảo mật tài khoản": password, two-factor switch and the list of signed-in devices with sign-out per device.
 * Meant as `children` of `ProfilePage` (or its own settings page). Destructive actions ask for confirmation.
 */
export function SecuritySettings({ passwordChangedAt, passwordRules, passwordSubmitting, passwordError, onChangePassword, twoFactor, onTwoFactorChange, sessions = [], onRevokeSession, onRevokeOthers, className }: SecuritySettingsProps) {
  const [pwOpen, setPwOpen] = React.useState(false)
  const [revokeId, setRevokeId] = React.useState<string>()
  const [revokeAll, setRevokeAll] = React.useState(false)
  const others = sessions.filter((s) => !s.current)
  return (
    <div data-slot="security-settings" className={className ?? "grid gap-4"}>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><KeyRound aria-hidden className="size-4 text-primary" />Mật khẩu</CardTitle><CardDescription>{passwordChangedAt ? `Đổi lần cuối: ${passwordChangedAt}.` : "Dùng mật khẩu mạnh và không trùng với dịch vụ khác."}</CardDescription></CardHeader>
        <CardContent><Button variant="outline" onClick={() => setPwOpen(true)}>Đổi mật khẩu</Button></CardContent>
      </Card>
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader><DialogTitle>Đổi mật khẩu</DialogTitle><DialogDescription>Nhập mật khẩu hiện tại và chọn mật khẩu mới.</DialogDescription></DialogHeader>
          <ChangePasswordForm rules={passwordRules} submitting={passwordSubmitting} error={passwordError} onSubmit={(v) => onChangePassword?.(v)} />
        </DialogContent>
      </Dialog>

      {twoFactor && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-1.5">
                <CardTitle className="flex items-center gap-2"><ShieldCheck aria-hidden className="size-4 text-primary" />Xác thực hai bước <Badge variant={twoFactor.enabled ? "success" : "secondary"}>{twoFactor.enabled ? "Đang bật" : "Đang tắt"}</Badge></CardTitle>
                <CardDescription>{twoFactor.enabled ? `Mỗi lần đăng nhập cần thêm mã xác thực${twoFactor.method ? ` (${twoFactor.method})` : ""}.` : "Thêm lớp bảo vệ: ngoài mật khẩu, cần mã xác thực khi đăng nhập."}</CardDescription>
              </div>
              <Switch aria-label="Xác thực hai bước" checked={twoFactor.enabled} onCheckedChange={(v) => onTwoFactorChange?.(v)} />
            </div>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1.5"><CardTitle>Thiết bị đang đăng nhập</CardTitle><CardDescription>Nếu thấy thiết bị lạ, hãy đăng xuất nó và đổi mật khẩu.</CardDescription></div>
            {others.length > 0 && <Button variant="outline" size="sm" onClick={() => setRevokeAll(true)}><LogOut />Đăng xuất các thiết bị khác</Button>}
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? <p className="m-0 text-body text-muted-foreground">Không có phiên nào khác.</p> : (
            <ul className="m-0 grid list-none gap-2 p-0">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
                  <span aria-hidden className="grid size-9 flex-none place-items-center rounded-full bg-secondary text-muted-foreground [&_svg]:size-[18px]">{s.kind === "mobile" ? <Smartphone /> : s.kind === "desktop" ? <Monitor /> : <Laptop />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="m-0 flex items-center gap-2 truncate text-body font-semibold">{s.device}{s.current && <Badge variant="success">Thiết bị này</Badge>}</p>
                    <p className="m-0 truncate text-small text-muted-foreground">{[s.location, s.ip, s.lastActive].filter(Boolean).join(" · ")}</p>
                  </div>
                  {!s.current && <Button variant="ghost" size="sm" aria-label={`Đăng xuất ${s.device}`} onClick={() => setRevokeId(s.id)}>Đăng xuất</Button>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog open={revokeId != null} onOpenChange={(o) => !o && setRevokeId(undefined)} variant="destructive" title="Đăng xuất thiết bị này?" description="Phiên trên thiết bị đó sẽ kết thúc ngay và phải đăng nhập lại." confirmLabel="Đăng xuất" onConfirm={() => { if (revokeId) onRevokeSession?.(revokeId) }} />
      <ConfirmDialog open={revokeAll} onOpenChange={setRevokeAll} variant="destructive" title="Đăng xuất các thiết bị khác?" description={`${others.length} phiên khác sẽ kết thúc ngay. Phiên hiện tại được giữ lại.`} confirmLabel="Đăng xuất tất cả" onConfirm={() => onRevokeOthers?.()} />
    </div>
  )
}
