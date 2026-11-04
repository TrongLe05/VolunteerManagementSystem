"use client"

// @dthu/ui 0.2.0 · block-auth
import * as React from "react"
import { ArrowLeft, Check, Circle, Eye, EyeOff } from "lucide-react"
import { Link } from "react-router"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useCountdown } from "@/lib/use-countdown"
import authBanner from "@/assets/auth-banner.jpg"

export { useCountdown }

export interface AuthBrandFeature {
  icon?: React.ReactNode
  title: string
  description?: string
}

/** Branding shared by every full-page auth screen; same props as `LoginPage` so one object themes the whole flow. */
export interface AuthBrandProps {
  /** Logo block above the form title. */
  brand?: React.ReactNode
  /** Headline of the brand panel. Without it the page is a single centred card (no side panel). */
  headline?: React.ReactNode
  /** Small uppercase organisation line above the headline. */
  org?: string
  /** Paragraph under the headline. */
  description?: string
  /** Bullet list of the brand panel. */
  features?: AuthBrandFeature[]
  /** Footer line (bottom-left of the brand panel, under the card on phones). */
  footer?: string
  /** CSS `background-image` value put under the brand panel's blue wash. */
  backgroundImage?: string
  /** Căn vị trí khối nội dung bên trái: "center" hoặc "bottom". @default "bottom" */
  brandAlign?: "center" | "bottom"
}

export interface AuthLayoutProps extends AuthBrandProps {
  /** Round icon above the title (status of the screen: key, mail, lock...). */
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Tone of the icon bubble. */
  tone?: "primary" | "success" | "warning" | "destructive"
  children?: React.ReactNode
  className?: string
}

const wash = "linear-gradient(90deg,rgba(7,18,38,.76) 0%,rgba(12,38,72,.32) 62%,rgba(0,0,0,0) 100%),linear-gradient(155deg,rgba(8,20,43,.78) 0%,rgba(24,62,112,.52) 54%,rgba(48,112,175,.28) 100%)"
/** Split layout: the form is a plain column on desktop and becomes a card once the brand panel is hidden. (Literal class strings: Tailwind cannot see composed ones.) */
const cardOnPhone = "max-lg:max-w-[424px] max-lg:rounded-[14px] max-lg:bg-background max-lg:px-[30px] max-lg:pt-8 max-lg:pb-[26px] max-lg:shadow-[0_1px_2px_rgba(0,14,28,0.1),0_12px_26px_-8px_rgba(0,14,28,0.3),0_32px_64px_-24px_rgba(0,14,28,0.34)] max-sm:px-[22px] max-sm:pt-[26px] max-sm:pb-[22px]"
const cardAlways = "max-w-[424px] rounded-[14px] bg-background px-[30px] pt-8 pb-[26px] shadow-[0_1px_2px_rgba(0,14,28,0.1),0_12px_26px_-8px_rgba(0,14,28,0.3),0_32px_64px_-24px_rgba(0,14,28,0.34)] max-sm:px-[22px] max-sm:pt-[26px] max-sm:pb-[22px]"
const toneBubble ={ primary: "bg-accent text-primary", success: "bg-success/15 text-success", warning: "bg-warning/15 text-warning", destructive: "bg-destructive/10 text-destructive" } as const

/**
 * Frame of the screens around login: forgot / reset password, OTP, signed out, lock screen.
 * With `headline` it is the split layout of `LoginPage` (brand panel + 384px form column); without it a single card on the sidebar blue.
 * At <= 1023px the panel is hidden and the form sits on a card.
 */
export function AuthLayout({ brand, headline, org, description, features, footer, backgroundImage, brandAlign = "bottom", icon, tone = "primary", title, subtitle, children, className }: AuthLayoutProps) {
  const split = headline != null
  return (
    <main data-slot="auth-layout" className={cn("relative grid min-h-screen min-h-dvh w-full overflow-y-auto bg-background text-foreground", split ? "grid-cols-[1.02fr_0.98fr] max-lg:grid-cols-1 max-lg:bg-[#002a47]" : "bg-[#002a47]", className)}>
      {split && (
        <aside
          aria-label="Giới thiệu"
          className={cn(
            "relative hidden flex-col overflow-hidden bg-sidebar px-12 text-white lg:flex min-h-screen",
            brandAlign === "bottom" ? "justify-end pb-28 pt-12" : "justify-center py-[46px]"
          )}
          style={{
            backgroundImage: [wash, backgroundImage, `url(${authBanner})`].filter(Boolean).join(","),
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        >
          <div className="relative">
            {org ? <Badge className="mb-1">{org}</Badge> : null}
            <h1 className="m-0 text-display leading-[1.2] font-extrabold tracking-[-0.015em] text-white max-xl:text-[28px] [&_span]:block [&_span]:text-[#7fd4ff]">{headline}</h1>
            {description ? <p className="mt-3.5 mb-0 max-w-[34ch] text-emph [text-wrap:pretty] text-[#cfe4f4]">{description}</p> : null}
            {features?.length ? (
              <ul className="m-0 mt-[26px] grid list-none gap-[11px] p-0">
                {features.map((f) => (
                  <li key={f.title} className="flex items-center gap-[11px] text-sm text-[#e2eff9]">
                    {f.icon ? <span className="shrink-0 text-[#7fd4ff] [&_svg]:size-[18px]">{f.icon}</span> : null}
                    <span>
                      {f.title}
                      {f.description ? <span className="ml-1.5 text-[#9dbdd6]">· {f.description}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          {footer ? <p className="absolute bottom-[46px] left-12 m-0 text-xs text-[#9dbdd6]">{footer}</p> : null}
        </aside>
      )}
      <section className={cn("grid min-h-screen content-center justify-items-center px-[34px] py-10 max-lg:px-6 max-sm:px-4 max-sm:py-7 overflow-y-auto", split ? "bg-background max-lg:bg-transparent" : "bg-transparent")}>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="absolute top-4 right-4 z-20 gap-1.5 bg-background/80 backdrop-blur"
        >
          <Link to="/">
            <ArrowLeft className="size-4" />
            Trang chủ
          </Link>
        </Button>
        <div className={cn("w-full max-w-[384px]", split ? cardOnPhone : cardAlways)}>
          {brand && <div className="mb-[22px] flex items-center gap-3 border-b border-border pb-5 max-lg:mb-5 max-lg:pb-[18px]">{brand}</div>}
          {icon && <span aria-hidden className={cn("mb-4 grid size-12 place-items-center rounded-full [&_svg]:size-6", toneBubble[tone])}>{icon}</span>}
          <h1 className="m-0 text-[25px] font-bold tracking-[-0.01em]">{title}</h1>
          {subtitle && <p className="m-0 mt-[3px] text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <p className={cn("mt-[22px] mb-0 text-center text-small text-white/60", split ? "hidden max-lg:block" : "block")}>{footer}</p> : null}
      </section>
    </main>
  )
}

export interface AuthFieldProps extends Omit<React.ComponentProps<"input">, "id"> {
  id: string
  label: string
  /** Leading icon (inside the input, 18px). */
  icon?: React.ReactNode
  /** Error text; also sets `aria-invalid`. */
  error?: string
  hint?: string
  /** Password inputs get a show/hide button unless this is false. */
  revealable?: boolean
}

const inputCls = "h-[46px] w-full rounded-[9px] border border-border-strong bg-background pr-11 text-lead text-foreground outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-muted-foreground focus:border-primary focus:shadow-focus-field disabled:cursor-not-allowed disabled:bg-secondary aria-invalid:border-destructive"

/** Labelled 46px text field of the auth screens, with leading icon, inline error and (for passwords) a show/hide button. */
export function AuthField({ id, label, icon, error, hint, revealable = true, type = "text", className, ...props }: AuthFieldProps) {
  const [show, setShow] = React.useState(false)
  const isPassword = type === "password"
  const describedBy = [error ? `${id}-err` : null, hint ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-body font-semibold text-foreground">{label}</label>
      <div className="relative flex items-center">
        {icon && <span aria-hidden className="pointer-events-none absolute left-[13px] text-muted-foreground [&_svg]:size-[18px]">{icon}</span>}
        <input id={id} type={isPassword && show ? "text" : type} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={cn(inputCls, icon ? "pl-[41px]" : "pl-3", !(isPassword && revealable) && "pr-3", className)} {...props} />
        {isPassword && revealable && (
          <button type="button" aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={show} onClick={() => setShow((s) => !s)} className="absolute right-1.5 grid size-[34px] cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent p-0 text-muted-foreground outline-none hover:bg-secondary focus-visible:shadow-focus">
            {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
      </div>
      {hint && !error && <p id={`${id}-hint`} className="m-0 mt-1 text-xs text-muted-foreground">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="m-0 mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

/** Full-width 47px primary button of the auth screens. */
export function AuthSubmit({ className, children, ...props }: React.ComponentProps<typeof Button>) {
  return <Button type="submit" className={cn("h-[47px] w-full rounded-[9px] text-lead", className)} {...props}>{children}</Button>
}

/** Text-style button (links such as "Quay lại đăng nhập"). */
export function AuthLink({ className, ...props }: React.ComponentProps<"button">) {
  return <button type="button" className={cn("cursor-pointer border-0 bg-transparent p-0 text-control font-medium text-primary outline-none hover:underline focus-visible:shadow-focus disabled:cursor-not-allowed disabled:text-subtle-foreground disabled:no-underline", className)} {...props} />
}

/** Error banner at the top of an auth form. */
export function AuthError({ children }: { children?: React.ReactNode }) {
  return children ? <p role="alert" className="m-0 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{children}</p> : null
}

export interface PasswordRule { id: string; label: string; test: (password: string) => boolean }

/** Default policy: at least 8 characters, upper and lower case, a digit and a symbol. Pass your own list to the pages to match the server. */
export const defaultPasswordRules: PasswordRule[] = [
  { id: "length", label: "Ít nhất 8 ký tự", test: (p) => p.length >= 8 },
  { id: "case", label: "Có chữ hoa và chữ thường", test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "digit", label: "Có chữ số", test: (p) => /\d/.test(p) },
  { id: "symbol", label: "Có ký tự đặc biệt", test: (p) => /[^A-Za-z0-9]/.test(p) },
]

/** How many rules a password passes and whether it passes all of them. */
export function evaluatePassword(password: string, rules: PasswordRule[] = defaultPasswordRules) {
  const checks = rules.map((r) => ({ id: r.id, label: r.label, ok: r.test(password) }))
  const passed = checks.filter((c) => c.ok).length
  return { checks, passed, total: rules.length, valid: passed === rules.length }
}

const strengthMeta = [
  { label: "Quá yếu", tone: "destructive" },
  { label: "Yếu", tone: "destructive" },
  { label: "Trung bình", tone: "warning" },
  { label: "Khá", tone: "warning" },
  { label: "Mạnh", tone: "success" },
] as const

/** Strength bar plus the checklist of rules. The text is announced politely so screen-reader users hear progress while typing. */
export function PasswordStrength({ password, rules = defaultPasswordRules, className }: { password: string; rules?: PasswordRule[]; className?: string }) {
  const { checks, passed, total } = evaluatePassword(password, rules)
  const level = password ? Math.min(4, Math.round((passed / total) * 4)) : 0
  const meta = strengthMeta[level]!
  return (
    <div data-slot="password-strength" className={cn("grid gap-2", className)}>
      <div className="flex items-center gap-3">
        <Progress value={password ? Math.max(8, (passed / total) * 100) : 0} tone={meta.tone} aria-label="Độ mạnh mật khẩu" className="h-1.5 flex-1" />
        <span aria-live="polite" className="w-20 text-right text-xs font-medium text-muted-foreground">{password ? meta.label : "Chưa nhập"}</span>
      </div>
      <ul className="m-0 grid list-none gap-1 p-0">
        {checks.map((c) => (
          <li key={c.id} data-ok={c.ok} className={cn("flex items-center gap-2 text-xs", c.ok ? "text-success" : "text-muted-foreground")}>
            {c.ok ? <Check aria-hidden className="size-3.5" /> : <Circle aria-hidden className="size-3.5" />}
            <span>{c.label}<span className="sr-only">{c.ok ? " — đạt" : " — chưa đạt"}</span></span>
          </li>
        ))}
      </ul>
    </div>
  )
}
