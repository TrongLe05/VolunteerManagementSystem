import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/** `tone` follows the reference `do-tien-do--*` colours: navy (default), xong (success), son (destructive), hophach (warning), xam (grey). */
const indicatorVariants = cva("h-full transition-[width] duration-300", {
  variants: {
    tone: { primary: "bg-primary", success: "bg-success", destructive: "bg-destructive", warning: "bg-warning", muted: "bg-subtle-foreground" },
    striped: { true: "bg-[linear-gradient(45deg,rgba(255,255,255,.22)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.22)_50%,rgba(255,255,255,.22)_75%,transparent_75%)] bg-[length:12px_12px]", false: "" },
  },
  defaultVariants: { tone: "primary", striped: false },
})

export function Progress({ className, value, tone, striped, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root> & VariantProps<typeof indicatorVariants>) {
  return (
    <ProgressPrimitive.Root className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} value={value} {...props}>
      <ProgressPrimitive.Indicator className={indicatorVariants({ tone, striped })} style={{ width: `${value ?? 0}%` }} />
    </ProgressPrimitive.Root>
  )
}
