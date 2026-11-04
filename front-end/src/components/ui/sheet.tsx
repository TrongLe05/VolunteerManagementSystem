"use client"

// @dthu/ui 0.2.0 · sheet
import * as React from "react"
import { Dialog as SheetPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useUiConfig } from "@/lib/ui-config"

/** Gốc của ngăn trượt (dựa trên Dialog). Điều khiển bằng `open`/`onOpenChange`. */
export const Sheet = SheetPrimitive.Root
export const SheetTrigger = SheetPrimitive.Trigger
export const SheetClose = SheetPrimitive.Close

/*
 * Side panel = reference `do-keo` (right drawer, 400px): surface, 1px line edge, shadow -12px 0 40px #101c2c29, overlay rgba(16,28,44,.18).
 *   header `do-keo-dau`  padding 13 16 12, 1px line-soft underline;  body `do-keo-than` padding 14 16;  close = 24px round ghost button.
 * Bottom sheets keep the mobile `do-sheet` look (radius 16 top, overlay .45).
 * Direct children that are not header/footer get the body padding unless `p-0` is passed in `className`.
 */
const sheetVariants = cva("anim-slide fixed z-overlay flex flex-col gap-0 overflow-y-auto bg-background p-0 text-body text-foreground outline-none", {
  variants: {
    side: {
      right: "anim-slide-right inset-y-0 right-0 h-full w-[min(100%,400px)] border-l border-border shadow-[-12px_0_40px_#101c2c29]",
      left: "anim-slide-left inset-y-0 left-0 h-full w-[min(100%,400px)] border-r border-border shadow-[12px_0_40px_#101c2c29]",
      top: "anim-slide-top inset-x-0 top-0 max-h-[85dvh] border-b border-border shadow-[0_12px_40px_#101c2c29]",
      bottom: "anim-slide-bottom inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl shadow-[0_-8px_24px_#101c2c29]",
    },
  },
  defaultVariants: { side: "right" },
})
const BODY = "[&>:not([data-slot=sheet-header],[data-slot=sheet-footer],[data-slot=sheet-close])]:px-4 [&>:not([data-slot=sheet-header],[data-slot=sheet-footer],[data-slot=sheet-close])]:py-3.5"

/** Nội dung ngăn trượt. `side` chọn cạnh xuất hiện: right (mặc định), left, top, bottom. */
export function SheetContent({ className, side, children, overlayClassName, hideClose, ...props }: React.ComponentProps<typeof SheetPrimitive.Content> & VariantProps<typeof sheetVariants> & { /** Extra classes for the backdrop (e.g. a blur). */ overlayClassName?: string; /** Hide the built-in close button when the content renders its own. */ hideClose?: boolean }) {
  const flush = /(^|\s)p-0(\s|$)/.test(className ?? "")
  const bottomOrTop = side === "bottom" || side === "top"
  const { labels } = useUiConfig()
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className={cn("fixed inset-0 z-overlay anim-fade", bottomOrTop ? "bg-[rgba(16,28,44,0.45)]" : "bg-[rgba(16,28,44,0.18)]", overlayClassName)} />
      <SheetPrimitive.Content className={cn(sheetVariants({ side }), !flush && BODY, className)} {...props}>
        {children}
        {!hideClose && <SheetPrimitive.Close data-slot="sheet-close" className="absolute top-[15px] right-4 inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-muted-foreground transition-colors duration-[120ms] outline-none hover:bg-secondary hover:text-foreground focus-visible:shadow-focus">
          <X className="size-3.5" /><span className="sr-only">{labels.close}</span>
        </SheetPrimitive.Close>}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}
export function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex min-h-[53px] flex-col justify-center gap-0.5 border-b border-[color-mix(in_srgb,var(--border)_55%,var(--background))] pt-[13px] pr-12 pb-3 pl-4", className)} {...props} />
}
export function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-footer" className={cn("mt-auto flex items-center gap-2 border-t border-[color-mix(in_srgb,var(--border)_55%,var(--background))] bg-background px-4 py-2.5", className)} {...props} />
}
export function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title className={cn("text-lead leading-tight font-bold text-foreground", className)} {...props} />
}
export function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description className={cn("text-xs text-subtle-foreground", className)} {...props} />
}
