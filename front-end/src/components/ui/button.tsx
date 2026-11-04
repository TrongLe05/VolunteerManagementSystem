import * as React from "react"
import { Slot } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useUiConfig } from "@/lib/ui-config"

/*
 * 1:1 with the reference `do-btn` family (bar size = 36px / 13.5px / 600, radius 6, gap 6):
 *   default     = do-btn--pri     (navy, hover navy-deep, disabled grey fill)
 *   outline     = do-btn--thuong  (white, 1px line border, ink-dim text; hover line-hard + ink)
 *   ghost       = do-btn--nhe     (transparent; hover surface-2)
 *   destructive = do-btn--nguy    (red fill)
 *   link        = do-btn--lien    (navy text, underline on hover)
 *   sm          = do-btn--ctl     (30px / 12.5px / icon 15)
 *   xs          = do-btn--nho     (24px pill / 11.5px / icon 13)
 *   icon*       = do-btn--vuong   (square 36 / 30 / 24)
 *   toolbar*    = dtb-fbtn / dtb-btn-pri / dtb-fbtn--sq (list toolbar: gap 7, padding 11|13, square 39)
 * Focus ring = shadow-focus (2px surface gap + 2px --ring, >= 3:1), touch devices (`coarse:`) get 40-44px targets, press = scale .95 + brightness .92 (keyframes `nut-nhan`).
 */
export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent text-control font-semibold no-underline transition-[color,background-color,border-color,box-shadow,transform,filter] duration-[120ms] outline-none focus-visible:shadow-focus active:scale-95 active:brightness-[.92] disabled:pointer-events-none disabled:cursor-default motion-reduce:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-[120ms] enabled:hover:[&_svg]:scale-[1.06] motion-reduce:[&_svg]:transition-none motion-reduce:enabled:hover:[&_svg]:scale-100",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:border-accent-foreground hover:bg-accent-foreground disabled:border-border-strong disabled:bg-border-strong dark:hover:border-primary/85 dark:hover:bg-primary/85",
        destructive: "border-destructive bg-destructive text-destructive-foreground disabled:border-border-strong disabled:bg-border-strong",
        outline: "border-border bg-background text-muted-foreground hover:border-border-strong hover:text-foreground disabled:text-subtle-foreground",
        secondary: "border-border bg-secondary text-secondary-foreground hover:border-border-strong hover:bg-muted disabled:text-subtle-foreground",
        ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground disabled:text-subtle-foreground",
        link: "text-primary hover:underline disabled:text-subtle-foreground",
      },
      size: {
        default: "h-9 px-3 coarse:h-11",
        sm: "h-[30px] px-2.5 text-small coarse:h-10 [&_svg]:size-[15px]",
        lg: "h-11 rounded-lg px-6 text-lead",
        xs: "h-6 rounded-full px-[9px] text-label coarse:h-8 [&_svg]:size-[13px]",
        icon: "size-9 p-0 coarse:size-11 [&_svg]:size-[18px]",
        "icon-sm": "size-[30px] p-0 coarse:size-10 [&_svg]:size-4",
        "icon-xs": "size-6 p-0 coarse:size-8 [&_svg]:size-3.5",
        /* list toolbar (reference `dtb-fbtn` / `dtb-btn-pri`): 36px, gap 7, padding 11 (primary 13), icon 14 */
        toolbar: "h-9 gap-[7px] px-[11px] coarse:h-11 [&_svg]:size-3.5",
        "toolbar-icon": "h-9 w-[39px] p-0 coarse:h-11 coarse:w-11 [&_svg]:size-[17px]",
      },
    },
    compoundVariants: [
      { variant: "link", class: "h-auto border-0 p-0" },
      { variant: "default", size: "toolbar", class: "px-[13px]" },
    ],
    defaultVariants: { variant: "default", size: "default" },
  },
)

export interface ButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  /** Render lên phần tử con (vd. thẻ `a`, `Link`) thay vì thẻ `button`, giữ nguyên kiểu dáng. */
  asChild?: boolean
  /** Kiểu nút: default, secondary, outline, ghost, destructive, link. */
  variant?: VariantProps<typeof buttonVariants>["variant"]
  /** Kích cỡ nút: default (36px), sm (30px), lg, xs (24px, bo tròn), icon / icon-sm / icon-xs (nút vuông chỉ có biểu tượng), toolbar / toolbar-icon (nút trên thanh công cụ danh sách). */
  size?: VariantProps<typeof buttonVariants>["size"]
}

/** Nút bấm. Nhận mọi thuộc tính của thẻ `button`; dùng `asChild` để biến liên kết thành nút. */
export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const ui = useUiConfig()
  const Comp = asChild ? Slot.Root : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size: size ?? ui.size }), className)} {...props} />
}
