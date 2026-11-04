"use client"

// @dthu/ui 0.2.0 · hover-card
import * as React from "react"
import { HoverCard as HoverCardPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/** Thẻ xem nhanh hiện khi rê chuột/focus vào trigger. Không hoạt động bằng cảm ứng: đừng đặt thông tin thiết yếu chỉ ở đây. */
export const HoverCard = HoverCardPrimitive.Root
export const HoverCardTrigger = HoverCardPrimitive.Trigger

/** Nội dung thẻ xem nhanh. */
export function HoverCardContent({ className, align = "center", sideOffset = 6, ...props }: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn("anim-popup z-overlay w-72 max-w-[calc(100vw-1rem)] rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg outline-none", className)}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}
