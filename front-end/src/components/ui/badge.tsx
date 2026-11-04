import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Reference `dtb-pill`: 11.5px / 600, 3px 10px padding, 1px transparent border, 6px gap, 0.01em tracking.
 * Soft backgrounds are the reference's `*-bg` tokens (≈10% of the tone over the surface); ink-100 = border at 58% over card.
 */
export const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-[3px] text-label leading-[1.45] font-semibold tracking-[0.01em] whitespace-nowrap [&>svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        // dtb-pill (neutral): ink-100 bg, ink-700 text
        secondary: "border-transparent bg-[color-mix(in_srgb,var(--border)_58%,var(--card))] text-[color-mix(in_srgb,var(--foreground)_55%,var(--muted-foreground))]",
        // dtb-pill-outline
        outline: "border-border-strong bg-transparent text-[color-mix(in_srgb,var(--foreground)_55%,var(--muted-foreground))]",
        destructive: "border-transparent bg-destructive/10 text-destructive",
        warning: "border-transparent bg-warning/10 text-warning",
        success: "border-transparent bg-success/10 text-success",
        // dtb-pill-blue: accent-soft bg, accent-strong text
        info: "border-transparent bg-accent text-accent-foreground",
        // dtb-pill-violet
        violet: "border-transparent bg-[#ece7f8] text-[#4b3a8c] dark:bg-[#2a2347] dark:text-[#c9bdf0]",
      },
      dot: { true: "before:size-1.5 before:shrink-0 before:rounded-full before:bg-current before:content-['']", false: "" },
    },
    defaultVariants: { variant: "default", dot: false },
  },
)

/** Nhãn trạng thái. `variant`: default, secondary, outline, destructive, warning, success, info, violet; `dot` thêm chấm tròn đầu nhãn (dtb-pill-dot). */
export function Badge({ className, variant, dot, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant, dot }), className)} {...props} />
}
