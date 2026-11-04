// @dthu/ui 0.2.0 · empty-state
import * as React from "react"
import { Inbox } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps extends Omit<React.ComponentProps<"div">, "title"> {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
}

/** Keyframes of the reference `do-empty-art` (de-vao, de-g1..3, de-bong), copied verbatim; React hoists and dedupes the tag. */
const keyframes = `@keyframes de-vao{0%{opacity:0;transform:translateY(8px)}100%{opacity:1;transform:none}}@keyframes de-g1{50%{transform:translate(-50%) rotate(-14deg)}}@keyframes de-g2{50%{transform:translate(-50%) rotate(12deg)}}@keyframes de-g3{50%{transform:translate(-50%) translateY(-6px)}}@keyframes de-bong{50%{opacity:.07;transform:translate(-50%) scale(.82)}}@media (prefers-reduced-motion:reduce){[data-slot=empty-art],[data-slot=empty-art] *{animation:none!important}}`

const card = "absolute bottom-2 left-1/2 grid h-[72px] w-14 origin-bottom place-items-center rounded-md border-[1.5px] border-border bg-card"

/** Animated art: three stacked cards that float, plus a shadow. Decorative (aria-hidden); still under prefers-reduced-motion. */
export function EmptyArt({ icon, className }: { icon?: React.ReactNode; className?: string }) {
  return (
    <>
      <style href="dthu-empty-art" precedence="default">{keyframes}</style>
      <span data-slot="empty-art" aria-hidden="true" className={cn("relative mx-auto mb-3.5 block h-[88px] w-24 animate-[de-vao_.5s_cubic-bezier(.2,.8,.2,1)_both] text-primary", className)}>
        <i className={cn(card, "animate-[de-g1_4.5s_ease-in-out_infinite] opacity-60 [transform:translate(-50%)_rotate(-10deg)]")} />
        <i className={cn(card, "animate-[de-g2_4.5s_ease-in-out_infinite] opacity-85 [transform:translate(-50%)_rotate(8deg)]")} />
        <i className={cn(card, "animate-[de-g3_4.5s_ease-in-out_infinite] border-primary text-primary [transform:translate(-50%)] [&_svg]:size-6 [&_svg]:stroke-[1.6]")}>{icon ?? <Inbox />}</i>
        <b className="absolute bottom-0 left-1/2 h-1.5 w-[54px] animate-[de-bong_4.5s_ease-in-out_infinite] rounded-full bg-current opacity-[.12] [transform:translate(-50%)]" />
      </span>
    </>
  )
}

/** Trạng thái rỗng (reference `dtb-state`): art, title 15px / 600, description 13px max 340px, then `action`. */
export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 px-5 py-10 text-center text-control text-muted-foreground", className)} {...props}>
      <EmptyArt icon={icon} />
      <div className="text-lead font-semibold text-foreground">{title}</div>
      {description && <div className="mt-0.5 max-w-[340px] text-body leading-normal text-muted-foreground">{description}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
