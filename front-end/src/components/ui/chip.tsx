"use client"

// @dthu/ui 0.2.0 · chip
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUiConfig } from "@/lib/ui-config"

export const chipVariants = cva(
  "inline-flex max-w-full items-center gap-1 rounded-full border text-label font-semibold transition-colors data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[color-mix(in_srgb,var(--border)_58%,var(--card))] text-[color-mix(in_srgb,var(--foreground)_55%,var(--muted-foreground))]",
        outline: "border-input bg-background text-foreground",
        primary: "border-transparent bg-primary/10 text-primary",
        success: "border-transparent bg-success/10 text-success",
        warning: "border-transparent bg-warning/10 text-warning",
        info: "border-transparent bg-accent text-accent-foreground",
        destructive: "border-transparent bg-destructive/10 text-destructive",
      },
      size: { sm: "h-5 pl-2 pr-1 text-caption", md: "h-7 pl-2.5 pr-1.5" },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
)

export interface ChipProps extends Omit<React.ComponentProps<"span">, "onClick" | "color"> {
  /** Màu/kiểu: default, outline, primary, success, warning, info, destructive. */
  variant?: VariantProps<typeof chipVariants>["variant"]
  /** Kích cỡ: sm hoặc md (mặc định). */
  size?: VariantProps<typeof chipVariants>["size"]
  /** Có truyền thì chip bấm được (render nút). */
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  /** Có truyền thì hiện nút xóa (x); cũng xóa bằng phím Backspace/Delete khi chip đang focus. */
  onDelete?: () => void
  /** Trạng thái đã chọn (chip dạng bật/tắt, `aria-pressed`). Đặt giá trị là chip trở thành nút chọn. */
  selected?: boolean
  /** Phần tử đầu chip: avatar hoặc biểu tượng. */
  avatar?: React.ReactNode
  /** Biểu tượng đầu chip (nhỏ hơn avatar). */
  icon?: React.ReactNode
  /** Vô hiệu hóa chip. */
  disabled?: boolean
  /** Nhãn đọc cho nút xóa (mặc định "Xóa"). @default Xóa */
  deleteLabel?: string
}

/** Chip nhỏ hiển thị nhãn/lựa chọn; có thể bấm, chọn (toggle) hoặc xóa. Kiểu MUI Chip. */
export function Chip({
  className, variant, size: sizeProp, onClick, onDelete, selected, avatar, icon, disabled, deleteLabel: deleteLabelProp, children, ...props
}: ChipProps) {
  const ui = useUiConfig()
  const size = sizeProp ?? (ui.size === "sm" ? "sm" : "md")
  const deleteLabel = deleteLabelProp ?? ui.labels.remove
  const interactive = !!onClick || selected !== undefined
  const lead = avatar ?? icon
  const body = (
    <>
      {lead ? <span aria-hidden className={cn("-ml-1 flex shrink-0 items-center [&_svg]:size-4 [&_[data-slot=avatar]]:size-5 [&_[data-slot=avatar]]:text-micro", size === "sm" && "-ml-0.5")}>{lead}</span> : null}
      <span className="truncate">{children}</span>
    </>
  )
  return (
    <span
      data-slot="chip"
      data-disabled={disabled || undefined}
      data-selected={selected || undefined}
      className={cn(
        chipVariants({ variant, size }),
        !onDelete && (size === "sm" ? "pr-2" : "pr-3"),
        interactive && "hover:brightness-95",
        selected && "ring-2 ring-primary ring-offset-1 ring-offset-background",
        className,
      )}
      {...props}
    >
      {interactive ? (
        <button
          type="button"
          disabled={disabled}
          aria-pressed={selected}
          onClick={onClick}
          onKeyDown={(e) => {
            if (onDelete && (e.key === "Backspace" || e.key === "Delete")) { e.preventDefault(); onDelete() }
          }}
          className="inline-flex min-w-0 items-center gap-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </button>
      ) : (
        <span className="inline-flex min-w-0 items-center gap-1">{body}</span>
      )}
      {onDelete ? (
        <button
          type="button"
          disabled={disabled}
          aria-label={deleteLabel}
          onClick={onDelete}
          className="flex size-5 shrink-0 items-center justify-center rounded-full opacity-70 outline-none hover:bg-foreground/10 hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5"
        >
          <X aria-hidden />
        </button>
      ) : null}
    </span>
  )
}
