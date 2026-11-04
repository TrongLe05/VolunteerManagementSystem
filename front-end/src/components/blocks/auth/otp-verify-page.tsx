import * as React from "react"
import { ArrowLeft, Smartphone } from "lucide-react"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { AuthError, AuthLayout, AuthLink, AuthSubmit, useCountdown, type AuthBrandProps } from "./parts"

export interface OtpVerifyPageProps extends AuthBrandProps {
  /** Where the code comes from. `app` = authenticator app (no resend). */
  method?: "app" | "sms" | "email"
  /** Masked destination, e.g. "0912 *** 789" or "a***@acme.vn". */
  target?: string
  /** Number of digits. Default 6. */
  length?: number
  submitting?: boolean
  error?: string
  /** Seconds before "Gửi lại mã" is enabled (sms / email). Default 30. */
  resendAfter?: number
  /** Offer a "tin tưởng thiết bị này" checkbox; its value is passed to `onSubmit`. */
  allowTrustDevice?: boolean
  /** Called when all digits are entered (automatically) or the button is pressed. */
  onSubmit?: (v: { code: string; trustDevice: boolean }) => void
  onResend?: () => void
  onUseAnotherMethod?: () => void
  onBack?: () => void
}

const methodText = {
  app: (t?: string) => `Mở ứng dụng xác thực${t ? ` (${t})` : ""} và nhập mã gồm {n} chữ số.`,
  sms: (t?: string) => `Chúng tôi đã gửi mã {n} chữ số qua tin nhắn tới ${t ?? "số điện thoại của bạn"}.`,
  email: (t?: string) => `Chúng tôi đã gửi mã {n} chữ số tới ${t ?? "email của bạn"}.`,
} as const

/** Second step of two-factor sign-in: digit boxes that submit on the last digit, resend cool-down, "use another method" and trusted-device option. */
export function OtpVerifyPage({ method = "app", target, length = 6, submitting, error, resendAfter = 30, allowTrustDevice, onSubmit, onResend, onUseAnotherMethod, onBack, ...brand }: OtpVerifyPageProps) {
  const [code, setCode] = React.useState("")
  const [trust, setTrust] = React.useState(false)
  const [left, restart] = useCountdown(resendAfter, method !== "app")
  const submit = (c: string) => { if (c.length === length) onSubmit?.({ code: c, trustDevice: trust }) }
  return (
    <AuthLayout {...brand} icon={<Smartphone />} title="Xác thực hai bước" subtitle={methodText[method](target).replace("{n}", String(length))}>
      <form noValidate onSubmit={(e) => { e.preventDefault(); submit(code) }} className="grid gap-[15px]">
        <AuthError>{error}</AuthError>
        <div>
          <label htmlFor="otp-code" className="mb-2 block text-body font-semibold text-foreground">Mã xác thực</label>
          <InputOTP id="otp-code" maxLength={length} value={code} onChange={setCode} onComplete={submit} inputMode="numeric" autoComplete="one-time-code" aria-invalid={error ? true : undefined} disabled={submitting} containerClassName="justify-between">
            <InputOTPGroup className="w-full justify-between gap-1.5 *:data-[slot=input-otp-slot]:h-12 *:data-[slot=input-otp-slot]:flex-1 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border">
              {Array.from({ length }, (_, i) => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        {allowTrustDevice && <label className="m-0 flex cursor-pointer items-center gap-2 text-control text-muted-foreground"><input type="checkbox" checked={trust} onChange={(e) => setTrust(e.target.checked)} className="m-0 size-4 accent-primary" />Tin tưởng thiết bị này trong 30 ngày</label>}
        <AuthSubmit disabled={submitting || code.length < length}>{submitting ? "Đang xác thực..." : "Xác nhận"}</AuthSubmit>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-body">
          {method !== "app" ? <AuthLink disabled={left > 0} onClick={() => { onResend?.(); restart(resendAfter) }}>{left > 0 ? `Gửi lại mã sau ${left}s` : "Gửi lại mã"}</AuthLink> : <span />}
          {onUseAnotherMethod && <AuthLink onClick={onUseAnotherMethod}>Dùng cách khác</AuthLink>}
        </div>
        {onBack && <div className="text-center"><AuthLink onClick={onBack} className="inline-flex items-center gap-1.5"><ArrowLeft aria-hidden className="size-4" />Quay lại đăng nhập</AuthLink></div>}
      </form>
    </AuthLayout>
  )
}
