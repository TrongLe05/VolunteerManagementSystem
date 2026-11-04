"use client";

// @dthu/ui 0.2.0 · block-dashboard
import * as React from "react";
import { ArrowLeft, Eye, EyeOff, Lock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import authBanner from "@/assets/auth-banner.jpg";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export interface LoginFeature {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}
export interface LoginPageProps {
  /** Logo block above the form title (right pane). */
  brand?: React.ReactNode;
  headline: React.ReactNode;
  features: LoginFeature[];
  /** Small uppercase organisation line above the headline. */
  org?: string;
  /** Paragraph under the headline. */
  description?: string;
  /** Footer line (bottom-left of the brand panel, under the card on phones). */
  footer?: string;
  /** CSS `background-image` value (e.g. `url(...)`) put under the brand panel's blue wash. */
  backgroundImage?: string;
  /** Căn vị trí khối nội dung bên trái: "center" (chính giữa) hoặc "bottom" (dời xuống dưới). @default "bottom" */
  brandAlign?: "center" | "bottom";
  title?: string;
  subtitle?: string;
  submitting?: boolean;
  error?: string;
  ssoLabel?: string;
  ssoIcon?: React.ReactNode;
  supportText?: string;
  supportLinkLabel?: string;
  onSubmit?: (v: {
    username: string;
    password: string;
    remember: boolean;
  }) => void;
  onSso?: () => void;
  onForgot?: () => void;
  onSupport?: () => void;
}

const field = "relative flex items-center";
const input =
  "h-[46px] w-full rounded-[9px] border border-[#d1dbe6] bg-white pr-11 pl-[41px] text-lead text-[#16232f] outline-none transition-[border-color,box-shadow] duration-[120ms] placeholder:text-muted-foreground focus:border-primary focus:shadow-focus-field aria-invalid:border-[#d33d4d] dark:border-border dark:bg-card dark:text-foreground";
const link =
  "cursor-pointer border-0 bg-transparent p-0 text-control font-medium text-primary hover:underline";

/**
 * Split login (reference `dof-login`): brand panel 1.02fr with a blue wash (46/48 padding, 34px headline, feature list) and a
 * 0.98fr form pane (384px column: logo, 25px title, 46px inputs with leading icons, 47px buttons). At <= 991px the brand panel
 * is hidden and the form sits on a dark blue card background.
 */
export function LoginPage({
  brand,
  headline,
  features,
  org,
  description,
  footer,
  backgroundImage,
  brandAlign = "bottom",
  title = "Đăng nhập",
  subtitle = "Tài khoản do cơ quan cấp",
  submitting,
  error,
  ssoLabel = "Đăng nhập bằng SSO",
  ssoIcon,
  supportText = "Không đăng nhập được?",
  supportLinkLabel = "Gửi yêu cầu hỗ trợ",
  onSubmit,
  onSso,
  onForgot,
  onSupport,
}: LoginPageProps) {
  const [show, setShow] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const userErr =
    touched && !username.trim() ? "Vui lòng nhập tài khoản" : undefined;
  const passErr = touched && !password ? "Vui lòng nhập mật khẩu" : undefined;
  const wash =
    "linear-gradient(90deg,rgba(7,18,38,.76) 0%,rgba(12,38,72,.32) 62%,rgba(0,0,0,0) 100%),linear-gradient(155deg,rgba(8,20,43,.78) 0%,rgba(24,62,112,.52) 54%,rgba(48,112,175,.28) 100%)";
  return (
    <div className="relative grid min-h-dvh w-full grid-cols-[1.02fr_0.98fr] bg-background text-foreground max-lg:grid-cols-1 max-lg:bg-[#002a47]">
      <aside
        aria-label="Giới thiệu"
        className={cn(
          "relative hidden flex-col overflow-hidden bg-sidebar px-12 text-white lg:flex min-h-screen",
          brandAlign === "bottom"
            ? "justify-end pb-28 pt-12"
            : "justify-center py-[46px]",
        )}
        style={{
          backgroundImage: [wash, backgroundImage, "url(" + authBanner + ")"]
            .filter(Boolean)
            .join(","),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative">
          {org ? <Badge className="mb-1">{org}</Badge> : null}
          <h1 className="m-0 text-display leading-[1.2] font-extrabold tracking-[-0.015em] text-white max-xl:text-[28px] [&_span]:block [&_span]:text-[#7fd4ff]">
            {headline}
          </h1>
          {description ? (
            <p className="mt-3.5 mb-0 max-w-[34ch] text-emph [text-wrap:pretty] text-[#cfe4f4]">
              {description}
            </p>
          ) : null}
          <ul className="m-0 mt-[26px] grid list-none gap-[11px] p-0">
            {features.map((f) => (
              <li
                key={f.title}
                className="flex items-center gap-[11px] text-sm text-[#e2eff9]"
              >
                {f.icon ? (
                  <span className="shrink-0 text-[#7fd4ff] [&_svg]:size-[18px]">
                    {f.icon}
                  </span>
                ) : null}
                <span>
                  {f.title}
                  {f.description ? (
                    <span className="ml-1.5 text-[#9dbdd6]">
                      · {f.description}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {footer ? (
          <p className="absolute bottom-[46px] left-12 m-0 text-xs text-[#9dbdd6]">
            {footer}
          </p>
        ) : null}
      </aside>
      <section className="grid min-h-screen content-center justify-items-center bg-background px-[34px] py-10 max-lg:bg-transparent max-lg:px-6 max-sm:px-4 max-sm:py-7 overflow-y-auto">
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
        <div className="w-full max-w-[384px] max-lg:max-w-[424px] max-lg:rounded-[14px] max-lg:bg-background max-lg:px-[30px] max-lg:pt-8 max-lg:pb-[26px] max-lg:shadow-[0_1px_2px_rgba(0,14,28,0.1),0_12px_26px_-8px_rgba(0,14,28,0.3),0_32px_64px_-24px_rgba(0,14,28,0.34)] max-sm:px-[22px] max-sm:pt-[26px] max-sm:pb-[22px]">
          {brand && (
            <div className="mb-[22px] flex items-center gap-3 border-b border-border pb-5 max-lg:mb-5 max-lg:pb-[18px]">
              {brand}
            </div>
          )}
          <h2 className="m-0 text-[25px] font-bold tracking-[-0.01em]">
            {title}
          </h2>
          <p className="m-0 mt-[3px] text-sm text-muted-foreground dark:text-muted-foreground">
            {subtitle}
          </p>
          <form
            className="mt-6 grid gap-[15px]"
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              setTouched(true);
              if (!username.trim() || !password) return;
              onSubmit?.({ username: username.trim(), password, remember });
            }}
          >
            {error && (
              <p
                role="alert"
                className="m-0 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <div>
              <label
                htmlFor="login-username"
                className="mb-1.5 block text-body font-semibold text-[#33475b] dark:text-foreground"
              >
                Tài khoản
              </label>
              <div className={field}>
                <User
                  aria-hidden
                  className="pointer-events-none absolute left-[13px] size-[18px] text-muted-foreground"
                />
                <input
                  id="login-username"
                  className={input}
                  type="text"
                  name="username"
                  autoComplete="username"
                  placeholder="Nhập tài khoản"
                  value={username}
                  aria-invalid={userErr ? true : undefined}
                  aria-describedby={userErr ? "login-username-err" : undefined}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              {userErr && (
                <p
                  id="login-username-err"
                  role="alert"
                  className="m-0 mt-1 text-xs text-destructive"
                >
                  {userErr}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-body font-semibold text-[#33475b] dark:text-foreground"
              >
                Mật khẩu
              </label>
              <div className={field}>
                <Lock
                  aria-hidden
                  className="pointer-events-none absolute left-[13px] size-[18px] text-muted-foreground"
                />
                <input
                  id="login-password"
                  className={input}
                  type={show ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  aria-invalid={passErr ? true : undefined}
                  aria-describedby={passErr ? "login-password-err" : undefined}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  aria-pressed={show}
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-1.5 grid size-[34px] cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent p-0 text-muted-foreground outline-none hover:bg-[rgba(127,153,178,0.14)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary"
                >
                  {show ? (
                    <EyeOff className="size-[18px]" />
                  ) : (
                    <Eye className="size-[18px]" />
                  )}
                </button>
              </div>
              {passErr && (
                <p
                  id="login-password-err"
                  role="alert"
                  className="m-0 mt-1 text-xs text-destructive"
                >
                  {passErr}
                </p>
              )}
            </div>
            <div className="-mt-[3px] flex items-center justify-between gap-3">
              <label className="m-0 flex cursor-pointer items-center gap-2 text-control text-muted-foreground dark:text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="m-0 size-4 accent-primary"
                />
                Ghi nhớ tài khoản
              </label>
              <button type="button" onClick={onForgot} className={link}>
                Quên mật khẩu?
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="flex h-[47px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-transparent bg-primary text-lead font-semibold text-primary-foreground transition-colors duration-[130ms] hover:enabled:bg-[#004572] disabled:cursor-not-allowed disabled:opacity-[0.62]"
            >
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
            <div className="my-0.5 flex items-center gap-3 text-small text-muted-foreground before:h-px before:flex-1 before:bg-[#e4ebf2] before:content-[''] after:h-px after:flex-1 after:bg-[#e4ebf2] after:content-[''] dark:before:bg-border dark:after:bg-border">
              hoặc
            </div>
            <button
              type="button"
              onClick={onSso}
              className="flex h-[47px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-[9px] border border-[#d1dbe6] bg-transparent text-lead font-semibold text-foreground transition-colors duration-[130ms] hover:border-primary hover:text-primary dark:border-border [&_svg]:size-[21px]"
            >
              {ssoIcon}
              {ssoLabel}
            </button>
            <p className="m-0 mt-3.5 text-center text-body text-muted-foreground dark:text-muted-foreground">
              {supportText}{" "}
              <button
                type="button"
                onClick={onSupport}
                className={cn(link, "text-body")}
              >
                {supportLinkLabel}
              </button>
            </p>
          </form>
        </div>
        {footer ? (
          <p className="mt-[22px] mb-0 hidden text-center text-small text-white/60 max-lg:block">
            {footer}
          </p>
        ) : null}
      </section>
    </div>
  );
}
