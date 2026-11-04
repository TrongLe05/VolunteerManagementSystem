"use client"

// @dthu/ui 0.2.0 · command
import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

/** Khung lệnh/tìm kiếm (cmdk). Dùng kèm CommandInput, CommandList, CommandItem. */
export function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn("flex w-full flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground", className)}
      {...props}
    />
  )
}

/* Search header = reference `do-sel-tim`: 36px tall, 1px line-soft underline, 15px magnifier ink-faint, 13px input. */
export function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-2 border-b border-[color-mix(in_srgb,var(--border)_55%,var(--background))] px-2.5 text-subtle-foreground">
      <Search className="size-[15px] shrink-0" />
      <CommandPrimitive.Input
        className={cn("h-[34px] min-w-0 flex-1 bg-transparent p-0 text-body text-foreground outline-none placeholder:text-subtle-foreground", className)}
        {...props}
      />
    </div>
  )
}

/* List = `do-sel-ds` (padding 5, max-height 240). */
export function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn("max-h-60 overflow-y-auto overscroll-contain p-[5px]", className)} {...props} />
}

/* Empty = `do-sel-trong`: centred 13px ink-faint. */
export function CommandEmpty(props: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className="p-2.5 text-center text-body text-subtle-foreground" {...props} />
}

export function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        "overflow-hidden text-foreground [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-label [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-subtle-foreground",
        className
      )}
      {...props}
    />
  )
}

export function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  )
}

/*
 * Item = `do-sel-muc`: min-height 34, padding 7/10, radius 6, 13.5px ink-dim; highlighted (cmdk `data-selected`) = surface-2 + ink;
 * `data-checked="true"` (the chosen value) = accent fill + semibold primary.
 */
export function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex min-h-[34px] cursor-pointer items-center gap-2 rounded-md px-2.5 py-[7px] text-control leading-[1.35] text-muted-foreground outline-none select-none [overflow-wrap:anywhere] data-[selected=true]:bg-secondary data-[selected=true]:text-foreground data-[checked=true]:bg-accent data-[checked=true]:font-semibold data-[checked=true]:text-primary data-[checked=true]:data-[selected=true]:bg-[color-mix(in_srgb,var(--primary)_22%,var(--background))] data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}
