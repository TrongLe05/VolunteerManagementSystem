"use client"

// @dthu/ui 0.2.0 · navigation-menu
import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Menu điều hướng kiểu mega menu cho desktop; nội dung hiện trong một khung `viewport` dùng chung.
 * Trên màn hình nhỏ nên dùng Sheet/Drawer chứa danh sách liên kết thay vì menu này.
 */
export function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  /** Hiện nội dung trong khung viewport dùng chung (mặc định bật). */
  viewport?: boolean
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn("relative z-10 flex max-w-max flex-1 items-center justify-center", className)}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  )
}

export function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("group flex flex-1 list-none items-center justify-center gap-1", className)}
      {...props}
    />
  )
}

export const NavigationMenuItem = NavigationMenuPrimitive.Item

export const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=open]:bg-accent/60",
)

export function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), className)}
      {...props}
    >
      {children}
      <ChevronDown aria-hidden className="size-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </NavigationMenuPrimitive.Trigger>
  )
}

export function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn("w-full p-2 md:absolute md:w-auto", className)}
      {...props}
    />
  )
}

export function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div className="absolute top-full left-0 isolate z-overlay flex justify-center">
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full origin-top-left overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg md:w-[var(--radix-navigation-menu-viewport-width)]",
          className
        )}
        {...props}
      />
    </div>
  )
}

/** Liên kết trong menu; truyền `asChild` để dùng `Link` của router. */
export function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={className}
      {...props}
    />
  )
}
