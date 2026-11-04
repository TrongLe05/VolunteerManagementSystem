"use client"

// @dthu/ui 0.2.0 · block-auth
import * as React from "react"
import { Lock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuthError, AuthField, AuthLink, AuthSubmit } from "./parts"

export interface LockScreenPageProps {
  name: string
  username?: string
  initials?: string
  avatarSrc?: string
  /** Logo shown top-left. */
  brand?: React.ReactNode
  /** CSS `background-image` value behind the dimmed overlay. */
  backgroundImage?: string
  submitting?: boolean
  error?: string
  /** Called with the typed password; the app decides whether it unlocks. */
  onUnlock?: (password: string) => void
  /** "Đăng nhập bằng tài khoản khác". */
  onSignOut?: () => void
}

const pad = (n: number) => String(n).padStart(2, "0")

/** Screen lock: keeps the user's place in the app but hides it until the password is typed again. Shows a clock like a phone lock screen. */
export function LockScreenPage({ name, username, initials, avatarSrc, brand, backgroundImage, submitting, error, onUnlock, onSignOut }: LockScreenPageProps) {
  const [now, setNow] = React.useState(() => new Date())
  const [password, setPassword] = React.useState("")
  const [touched, setTouched] = React.useState(false)
  React.useEffect(() => { const t = setInterval(() => setNow(new Date()), 15_000); return () => clearInterval(t) }, [])
  const err = touched && !password ? "Vui lòng nhập mật khẩu" : undefined
  const date = new Intl.DateTimeFormat("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" }).format(now)
  return (
    <main data-slot="lock-screen" className="relative grid h-full min-h-0 w-full grid-rows-[auto_1fr] overflow-y-auto bg-sidebar text-white" style={{ backgroundImage: [backgroundImage && "linear-gradient(rgba(0,18,34,.7),rgba(0,18,34,.7))", backgroundImage, "linear-gradient(155deg,var(--sidebar),var(--primary))"].filter(Boolean).join(","), backgroundSize: "cover", backgroundPosition: "center" }}>
      <header className="flex items-center justify-between px-8 py-6 max-sm:px-4">{brand ?? <span />}<span className="flex items-center gap-1.5 text-small text-white/70"><Lock aria-hidden className="size-3.5" />Màn hình đang khóa</span></header>
      <div className="grid content-center justify-items-center gap-6 px-4 pb-12">
        <div className="text-center">
          <time dateTime={now.toISOString()} className="block text-[64px] leading-none font-extrabold tracking-tight tabular-nums max-sm:text-[48px]">{pad(now.getHours())}:{pad(now.getMinutes())}</time>
          <p className="m-0 mt-2 text-lead text-white/75 capitalize">{date}</p>
        </div>
        <section aria-label="Mở khóa" className="w-full max-w-[360px] rounded-[14px] bg-background px-6 pt-6 pb-5 text-foreground shadow-[0_12px_26px_-8px_rgba(0,14,28,0.3),0_32px_64px_-24px_rgba(0,14,28,0.34)]">
          <div className="mb-4 flex items-center gap-3">
            <Avatar className="size-12"><AvatarImage src={avatarSrc} alt="" /><AvatarFallback>{initials ?? name.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase()}</AvatarFallback></Avatar>
            <div className="min-w-0"><h1 className="m-0 truncate text-lead font-bold">{name}</h1>{username && <p className="m-0 truncate text-small text-muted-foreground">{username}</p>}</div>
          </div>
          <form noValidate onSubmit={(e) => { e.preventDefault(); setTouched(true); if (password) onUnlock?.(password) }} className="grid gap-3.5">
            <AuthError>{error}</AuthError>
            <AuthField id="lock-password" type="password" label="Mật khẩu" icon={<Lock />} autoComplete="current-password" autoFocus placeholder="Nhập mật khẩu để mở khóa" value={password} onChange={(e) => setPassword(e.target.value)} error={err} />
            <AuthSubmit disabled={submitting}>{submitting ? "Đang mở khóa..." : "Mở khóa"}</AuthSubmit>
            {onSignOut && <div className="text-center"><AuthLink onClick={onSignOut}>Đăng nhập bằng tài khoản khác</AuthLink></div>}
          </form>
        </section>
      </div>
    </main>
  )
}
