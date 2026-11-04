"use client"

// @dthu/ui 0.2.0 · select
import * as React from "react"
import { Select as SelectPrimitive } from "radix-ui"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/** Gốc của danh sách chọn. Dùng `value`/`onValueChange` (điều khiển) hoặc `defaultValue` (không điều khiển). */
export const Select = SelectPrimitive.Root
export const SelectGroup = SelectPrimitive.Group
/** Hiển thị giá trị đang chọn; `placeholder` hiện khi chưa chọn. */
export const SelectValue = SelectPrimitive.Value

/*
 * Trigger = reference `do-sel-o` (36px, radius 6, 1px line border, 13px ink, padding 0 6 0 11, chevron 16px ink-faint that turns
 * navy + rotates when open; hover line-hard; open/focus = navy border + 3px ring; disabled = surface-2 fill).
 * With `label` it becomes the toolbar filter `dtb-fo` ("Loại: Tất cả"): label 13.5/600 ink-dim + bold value; `active` = the
 * "set" state (navy-soft fill, navy-line border, navy label).
 */
/** Nút mở danh sách. Đặt `aria-label` nếu không có nhãn đi kèm. */
export function SelectTrigger({ className, children, label, active, ...props }: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  /** Nhãn tiền tố kiểu bộ lọc thanh công cụ, vd. "Loại" → "Loại: Tất cả". */
  label?: React.ReactNode
  /** Với `label`: bộ lọc đang có giá trị (nền xanh nhạt). */
  active?: boolean
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-active={active || undefined}
      className={cn(
        "group/sel flex h-9 w-full coarse:h-11 coarse:text-base cursor-pointer items-center gap-1.5 rounded-md border border-input bg-background pr-1.5 pl-[11px] text-left text-body leading-[22px] whitespace-nowrap text-foreground transition-[border-color,box-shadow] duration-[120ms] outline-none hover:border-muted-foreground focus-visible:border-primary focus-visible:shadow-focus-field data-[state=open]:border-primary data-[state=open]:shadow-[0_0_0_3px_color-mix(in_srgb,var(--primary)_12%,transparent)] disabled:cursor-not-allowed disabled:bg-secondary disabled:text-subtle-foreground aria-invalid:border-destructive data-[placeholder]:text-subtle-foreground [&>span:not([data-slot])]:min-w-0 [&>span:not([data-slot])]:flex-1 [&>span:not([data-slot])]:truncate [&>span:not([data-slot])]:text-left",
        label !== undefined && "pr-1 text-control font-bold data-[active]:border-[color-mix(in_srgb,var(--primary)_22%,var(--background))] data-[active]:bg-accent",
        className,
      )}
      {...props}
    >
      {label !== undefined && (
        <span data-slot="select-label" className="shrink-0 text-control font-semibold text-muted-foreground after:content-[':'] group-data-[active]/sel:text-primary">{label}</span>
      )}
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="ml-auto size-4 shrink-0 text-subtle-foreground transition-transform duration-150 group-data-[state=open]/sel:rotate-180 group-data-[state=open]/sel:text-primary" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

/*
 * Popup = reference `do-sel-menu` (radius 9, 1px line border, surface, padding 5, shadow-s2) with `do-sel-ds` list (max-height 240).
 */
export function SelectContent({ className, children, position = "popper", ...props }: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        className={cn("anim-popup relative z-overlay max-h-[260px] min-w-[8rem] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-[0_3px_12px_#101c2c1a,0_1px_3px_#101c2c12] outline-none", position === "popper" && "w-[var(--radix-select-trigger-width)] translate-y-1", className)}
        {...props}
      >
        <SelectPrimitive.Viewport className="max-h-[inherit] p-[5px]">{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

/*
 * Option = reference `do-sel-muc`: min-height 34, padding 7/10, radius 6, 13.5px ink-dim; highlighted = surface-2 + ink;
 * selected = accent fill + semibold primary (selected + highlighted = navy-line fill); no tick icon.
 */
/** Một lựa chọn; `value` là giá trị trả về, `disabled` để vô hiệu. */
export function SelectItem({ className, children, ...props }: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex min-h-[34px] w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-[7px] text-control leading-[1.35] text-muted-foreground outline-none select-none [overflow-wrap:anywhere] data-[highlighted]:bg-secondary data-[highlighted]:text-foreground data-[state=checked]:bg-accent data-[state=checked]:font-semibold data-[state=checked]:text-primary data-[state=checked]:data-[highlighted]:bg-[color-mix(in_srgb,var(--primary)_22%,var(--background))] data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="sr-only"><Check /></SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}

export function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return <SelectPrimitive.Label className={cn("px-2.5 py-1.5 text-label font-semibold text-subtle-foreground", className)} {...props} />
}
export function SelectSeparator({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return <SelectPrimitive.Separator className={cn("mx-0.5 my-1 h-px bg-[color-mix(in_srgb,var(--border)_55%,var(--background))]", className)} {...props} />
}
