"use client"

// @dthu/ui 0.2.0 · dropdown-menu-extras
import * as React from "react"
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"
import { Check, ChevronRight, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Bộ class dùng chung cho mọi loại menu (Dropdown, Context, Menubar) để giao diện nhất quán.
 * Dùng nội bộ giữa các component menu; không bắt buộc với người dùng cuối.
 */
export const menuStyles = {
  /* reference `dtb-rmenu-tam` / `do-menu-pop`: radius 10, 1px line border, padding 4, shadow 0 12 32 /.16 + 0 2 6 /.06 */
  content: "anim-popup z-overlay min-w-[176px] overflow-hidden rounded-[10px] border border-border bg-popover p-1 text-popover-foreground shadow-[0_12px_32px_rgba(16,28,44,0.16),0_2px_6px_rgba(16,28,44,0.06)]",
  /* reference `dtb-rmenu-muc` / `do-menu-it`: 30px, padding 0 8, gap 8, radius 6, 13px ink; highlighted = surface-2; icon 16px ink-faint */
  item: "relative flex min-h-[30px] cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-body text-foreground outline-none select-none transition-colors duration-100 data-[highlighted]:bg-secondary data-[highlighted]:text-foreground active:bg-muted data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg:not([class*='text-'])]:text-muted-foreground",
  checkable: "relative flex min-h-[30px] cursor-pointer items-center gap-2 rounded-md py-1 pr-2 pl-8 text-body text-foreground outline-none select-none transition-colors duration-100 data-[highlighted]:bg-secondary data-[highlighted]:text-foreground active:bg-muted data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  subTrigger: "data-[state=open]:bg-secondary data-[state=open]:text-foreground",
  indicator: "pointer-events-none absolute left-2 flex size-4 items-center justify-center text-primary",
  label: "px-2 py-1.5 text-label font-semibold text-subtle-foreground",
  separator: "mx-0.5 my-1 h-px bg-[color-mix(in_srgb,var(--border)_55%,var(--background))]",
  shortcut: "ml-auto pl-4 font-mono text-label text-subtle-foreground",
  /* reference `.pha` / `do-menu-it--nguy`: danger text, danger-soft fill when highlighted */
  destructive: "text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive [&_svg]:text-current",
} as const

/** Mục menu dạng hộp kiểm (bật/tắt). */
export function DropdownMenuCheckboxItem({ className, children, checked, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem data-slot="dropdown-menu-checkbox-item" className={cn(menuStyles.checkable, className)} checked={checked} {...props}>
      <span className={menuStyles.indicator}>
        <DropdownMenuPrimitive.ItemIndicator><Check /></DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  )
}

/** Nhóm các mục chọn một (radio). Dùng `value`/`onValueChange`. */
export function DropdownMenuRadioGroup(props: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />
}

/** Mục chọn một trong nhóm `DropdownMenuRadioGroup`. */
export function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem data-slot="dropdown-menu-radio-item" className={cn(menuStyles.checkable, className)} {...props}>
      <span className={menuStyles.indicator}>
        <DropdownMenuPrimitive.ItemIndicator><Circle className="size-2 fill-current" /></DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  )
}

/** Gốc của menu con. */
export const DropdownMenuSub = DropdownMenuPrimitive.Sub

/** Mục mở menu con, tự thêm mũi tên. */
export function DropdownMenuSubTrigger({ className, inset, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }) {
  return (
    <DropdownMenuPrimitive.SubTrigger data-slot="dropdown-menu-sub-trigger" className={cn(menuStyles.item, menuStyles.subTrigger, inset && "pl-8", className)} {...props}>
      {children}
      <ChevronRight className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

/** Nội dung menu con. */
export function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent data-slot="dropdown-menu-sub-content" className={cn(menuStyles.content, className)} {...props} />
    </DropdownMenuPrimitive.Portal>
  )
}

/** Phím tắt hiển thị bên phải mục menu (chỉ để hiển thị, không gắn sự kiện). */
export function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="dropdown-menu-shortcut" className={cn(menuStyles.shortcut, className)} {...props} />
}
