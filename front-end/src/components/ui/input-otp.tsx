"use client"

// @dthu/ui 0.2.0 · input-otp
import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"
import { cn } from "@/lib/utils"

/** Ô nhập mã OTP. Dùng cùng `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`. `maxLength` là số ký tự, `onComplete` gọi khi nhập đủ. */
export function InputOTP({ className, containerClassName, ...props }: React.ComponentProps<typeof OTPInput>) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn("flex items-center gap-2 has-[:disabled]:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  )
}

/** Nhóm các ô liền nhau. */
export function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="input-otp-group" className={cn("flex items-center", className)} {...props} />
}

/** Một ô ký tự; `index` là vị trí trong mã. */
export function InputOTPSlot({ index, className, ...props }: React.ComponentProps<"div"> & { index: number }) {
  const ctx = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = ctx.slots[index] ?? {}
  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "relative flex size-9 items-center justify-center border-y border-r border-input bg-background text-control font-medium shadow-xs transition-colors first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-2 data-[active=true]:ring-ring/30",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-pulse bg-foreground" />
        </div>
      )}
    </div>
  )
}

/** Dấu ngăn cách giữa hai nhóm. */
export function InputOTPSeparator(props: React.ComponentProps<"div">) {
  return <div data-slot="input-otp-separator" role="separator" {...props}><Minus className="size-4 text-muted-foreground" /></div>
}
