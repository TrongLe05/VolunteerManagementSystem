"use client"

// @dthu/ui 0.2.0 Â· checkbox
import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"
import { Check, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

/*
 * 1:1 with the reference `do-check .o`: 16x16, radius 3, 1px line border, white fill; checked/indeterminate = primary fill
 * with a white tick; hover (unchecked) = line-hard border; focus = primary border + 3px ring (primary @ 12%); disabled = 55% opacity.
 */
export function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[3px] border border-input bg-background p-0 text-primary-foreground transition-[background-color,border-color,box-shadow] duration-[120ms] outline-none after:absolute after:-inset-2.5 after:content-[''] md:after:-inset-1 hover:data-[state=unchecked]:border-muted-foreground focus-visible:border-primary focus-visible:shadow-focus-field disabled:cursor-default disabled:opacity-55 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary aria-invalid:border-destructive",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        {props.checked === "indeterminate" ? <Minus className="size-3" strokeWidth={3} /> : <Check className="size-3" strokeWidth={3} />}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
