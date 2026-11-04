"use client"

// @dthu/ui 0.2.0 · dialog
import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUiConfig } from "@/lib/ui-config"

/** Gốc của hộp thoại. Dùng `open`/`onOpenChange` để điều khiển, hoặc `DialogTrigger` để mở không điều khiển. */
export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

/*
 * Modal = reference `do-modal`: radius 9, surface, shadow-s2, overlay rgba(16,28,44,.48), max-height 100vh-80px (-24px on phones).
 *   header  `do-modal-dau`  padding 10 54 10 18, 1px line underline, title 14.5/700, description 12px ink-faint
 *   body    `do-modal-than` padding 16 18 (applied to every direct child that is not a header/footer, unless `p-0` is passed)
 *   footer  `do-modal-chan` surface-2, 1px line top border, padding 10 18, buttons right-aligned, gap 8
 *   close   `.x` 30x30 / radius 6 / 16px icon, top-right of the header.
 */
const BODY = "[&>:not([data-slot=dialog-header],[data-slot=dialog-footer],[data-slot=dialog-close])]:px-[18px] [&>:not([data-slot=dialog-header],[data-slot=dialog-footer],[data-slot=dialog-close])]:py-4"

/** Nội dung hộp thoại: có lớp phủ, khóa focus và đóng bằng Esc. Luôn kèm `DialogTitle` để trình đọc màn hình đọc được. */
export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, onPointerDownOutside, onInteractOutside, ...props }, ref) => {
  const flush = /(^|\s)p-0(\s|$)/.test(className ?? "")
  const { labels } = useUiConfig()

  const handleOutsideInteraction = (
    e: any,
    callback?: (event: any) => void
  ) => {
    const originalEvent = e.detail?.originalEvent as MouseEvent | PointerEvent | undefined
    const target = (originalEvent?.target || e.target) as HTMLElement | null

    // 1. Cho phép click tự do vào Combobox, Popover, Select hoặc Portal của Base UI bên ngoài Dialog
    if (
      target?.closest?.(
        '[data-slot*="combobox"], [data-slot*="popover"], [data-slot*="content"], [role="listbox"], [role="option"], [data-base-ui-portal]'
      )
    ) {
      e.preventDefault()
      return
    }

    // 2. Cho phép tương tác với popup chọn ngày/giờ native của trình duyệt (Chrome/Edge/Blink)
    const activeEl = document.activeElement
    if (
      activeEl instanceof HTMLInputElement &&
      (activeEl.type === "date" ||
        activeEl.type === "datetime-local" ||
        activeEl.type === "time")
    ) {
      e.preventDefault()
      return
    }

    callback?.(e)
  }

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-overlay bg-[rgba(16,28,44,0.48)] anim-fade" />
      <DialogPrimitive.Content
        ref={ref}
        data-slot="dialog-content"
        className={cn(
          "anim-pop fixed top-1/2 left-1/2 z-overlay grid max-h-[calc(100dvh-1.5rem)] w-full max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 gap-0 overflow-y-auto rounded-lg bg-background p-0 text-foreground shadow-[0_3px_12px_#101c2c1a,0_1px_3px_#101c2c12] outline-none sm:max-h-[calc(100dvh-5rem)] sm:max-w-[34rem]",
          !flush && BODY,
          className
        )}
        onPointerDownOutside={(e) => handleOutsideInteraction(e, onPointerDownOutside)}
        onInteractOutside={(e) => handleOutsideInteraction(e, onInteractOutside)}
        {...props}
      >
        {children}
        <DialogPrimitive.Close data-slot="dialog-close" className="absolute top-2.5 right-3.5 inline-flex size-[30px] cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-secondary hover:text-foreground focus-visible:bg-secondary focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
          <X className="size-4" />
          <span className="sr-only">{labels.close}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
DialogContent.displayName = "DialogContent"

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-header" className={cn("flex flex-col gap-px border-b border-border py-2.5 pr-[54px] pl-[18px]", className)} {...props} />
}
export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="dialog-footer" className={cn("flex flex-col-reverse flex-wrap gap-2 rounded-b-lg border-t border-border bg-secondary px-[18px] py-2.5 sm:flex-row sm:items-center sm:justify-end", className)} {...props} />
}
/** Tiêu đề hộp thoại (bắt buộc cho khả năng tiếp cận). */
export function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-emph leading-tight font-bold text-foreground", className)} {...props} />
}
export function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-xs leading-[1.3] text-subtle-foreground", className)} {...props} />
}
