"use client"

// @dthu/ui 0.2.0 · tooltip
import * as React from "react"
import { Tooltip as TooltipPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

/* Reference `do-f-tip-noi`: ink fill, white 12px/1.45 text, padding 8/12, radius 6, max-width 280, shadow-s2. */
export function TooltipContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn("z-tooltip max-w-[280px] rounded-md bg-foreground px-3 py-2 text-xs leading-[1.45] [overflow-wrap:anywhere] text-background shadow-[0_3px_12px_#101c2c1a,0_1px_3px_#101c2c12] anim-popup", className)}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}
