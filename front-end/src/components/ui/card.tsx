import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Widget card of the dashboard (`kw--the`): radius 14, 1px soft border (--bd-ke ≈ border 67% over card),
 * shadow `0 1px 2px #0b2e4a0d, 0 4px 16px #0b2e4a0f`. Header padding 16px 18px 0, body 14px 18px 18px.
 * Ghép với CardHeader, CardTitle, CardDescription, CardContent, CardFooter; nhận mọi thuộc tính của thẻ `div`.
 */
export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("flex flex-col rounded-xl border border-[color-mix(in_srgb,var(--border)_67%,var(--card))] bg-card pb-[18px] text-card-foreground shadow-[0_1px_2px_#0b2e4a0d,0_4px_16px_#0b2e4a0f]", className)} {...props} />
}
/** Title and note sit on one baseline row and wrap (`kw__dau`). */
export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-header" className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1 px-[18px] pt-4", className)} {...props} />
}
export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return <h3 data-slot="card-title" className={cn("m-0 text-emph leading-tight font-semibold tracking-[-0.01em]", className)} {...props} />
}
export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p data-slot="card-description" className={cn("text-xs text-[color-mix(in_srgb,var(--subtle-foreground)_70%,var(--muted-foreground))]", className)} {...props} />
}
export function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-[18px] pt-3.5", className)} {...props} />
}
export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-footer" className={cn("flex items-center px-[18px] pt-3.5", className)} {...props} />
}
