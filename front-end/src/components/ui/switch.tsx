"use client"

// @dthu/ui 0.2.0 · switch
import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/*
 * 1:1 with the reference `do-switch .pill`: 34x18 pill, line-coloured track (checked = primary), 14px white thumb with a
 * 1px shadow sliding 2px -> 18px, focus = 3px ring (primary @ 12%), disabled keeps the look but stops pointer.
 */
export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer relative inline-flex h-[18px] w-[34px] shrink-0 cursor-pointer items-center rounded-full border-0 bg-input p-0 transition-[background-color,box-shadow] duration-[120ms] outline-none after:absolute after:-inset-x-1 after:-inset-y-3 after:content-[''] md:after:-inset-y-1.5 focus-visible:shadow-focus disabled:cursor-default disabled:opacity-55 data-[state=checked]:bg-primary",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb className="pointer-events-none block size-3.5 translate-x-0.5 rounded-full bg-background shadow-[0_1px_2px_#101c2c12] transition-transform duration-[120ms] data-[state=checked]:translate-x-[18px]" />
    </SwitchPrimitive.Root>
  )
}
