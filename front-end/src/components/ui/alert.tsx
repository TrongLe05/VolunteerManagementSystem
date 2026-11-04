// @dthu/ui 0.2.0 · alert
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/** Banner: radius 6 (control), 1px tone line, soft tone fill (reference `ht-err-banner` / `vbnb-source-banner`), 13px text. */
const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-md border px-3 py-2 text-body has-[>svg]:grid-cols-[1.125rem_1fr] has-[>svg]:gap-x-2 [&>svg]:size-[18px] [&>svg]:translate-y-px",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        info: "border-primary/25 bg-accent text-accent-foreground",
        warning: "border-warning/30 bg-warning/10 text-warning",
        success: "border-success/25 bg-success/10 text-success",
        destructive: "border-destructive/30 bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div role="alert" data-slot="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}
export function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("col-start-2 font-semibold", className)} {...props} />
}
export function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("col-start-2 text-body opacity-90", className)} {...props} />
}
