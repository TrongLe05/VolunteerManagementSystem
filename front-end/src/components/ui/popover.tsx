import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger
export const PopoverAnchor = PopoverPrimitive.Anchor

export function PopoverContent({ className, align = "center", sideOffset = 6, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        className={cn("anim-popup z-overlay w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[0_3px_12px_#101c2c1a,0_1px_3px_#101c2c12] outline-none", className)}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}
