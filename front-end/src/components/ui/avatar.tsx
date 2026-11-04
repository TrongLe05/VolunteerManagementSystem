import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

/** Reference `dtb-avatar`: 27px circle. */
export function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return <AvatarPrimitive.Root data-slot="avatar" className={cn("relative flex size-[27px] shrink-0 overflow-hidden rounded-full", className)} {...props} />
}
export function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return <AvatarPrimitive.Image data-slot="avatar-image" className={cn("aspect-square size-full", className)} {...props} />
}
/** Initials: 10.5px / 700 uppercase, accent text on accent-soft with a 1px accent-line border (accent-line = primary at 22% over card). */
export function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return <AvatarPrimitive.Fallback data-slot="avatar-fallback" className={cn("flex size-full items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--primary)_22%,var(--card))] bg-accent text-tiny leading-none font-bold tracking-normal text-primary uppercase select-none", className)} {...props} />
}
