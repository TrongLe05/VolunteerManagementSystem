// @dthu/ui 0.2.0 · kbd
import * as React from "react"
import { cn } from "@/lib/utils"

/** Phím bàn phím dạng chip (reference `.dtb-tsearch kbd`: 11px mono, surface-2, 1px border, 4px radius), ví dụ `<Kbd>/</Kbd>`. */
export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-[19px] min-w-[19px] select-none items-center justify-center gap-1 rounded-sm border bg-secondary px-[5px] font-mono text-caption font-normal text-subtle-foreground [&_svg]:size-3",
        className,
      )}
      {...props}
    />
  )
}

/** Nhóm nhiều phím liền nhau (tổ hợp phím), ví dụ Ctrl + K. */
export function KbdGroup({ className, ...props }: React.ComponentProps<"span">) {
  return <span data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props} />
}
