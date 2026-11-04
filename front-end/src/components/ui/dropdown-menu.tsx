import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { menuStyles } from "@/components/ui/dropdown-menu-extras"

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
export const DropdownMenuGroup = DropdownMenuPrimitive.Group

/** Khung menu thả xuống (reference `dtb-rmenu-tam`: bo 10, viền line, đổ bóng). Có thể truyền `align`/`side`. */
export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        sideOffset={sideOffset}
        className={cn(menuStyles.content, className)}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}
/** Một mục menu; `variant="destructive"` tô đỏ (hành động xóa). */
export function DropdownMenuItem({ className, inset, variant, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { inset?: boolean; variant?: "default" | "destructive" }) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(menuStyles.item, inset && "pl-8", variant === "destructive" && menuStyles.destructive, className)}
      {...props}
    />
  )
}
export function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label>) {
  return <DropdownMenuPrimitive.Label className={cn(menuStyles.label, className)} {...props} />
}
export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return <DropdownMenuPrimitive.Separator className={cn(menuStyles.separator, className)} {...props} />
}
