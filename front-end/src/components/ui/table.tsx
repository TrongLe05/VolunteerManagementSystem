// @dthu/ui 0.2.0 · table
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Reference `dtb-table`: separate borders, th/td 7px side padding (first/last 14px = --dtb-pad-x),
 * header 11.5px bold caps on surface-2, body 13px / 1.45 with soft (ink-100) row lines, hover and selected row fills.
 * `border-soft` = border at 58% over card.
 */
export const tableSoftBorder = "border-[color-mix(in_srgb,var(--border)_58%,var(--card))]"

/** Bảng dữ liệu. Có sẵn khung cuộn ngang; ghép với TableHeader, TableBody, TableRow, TableHead, TableCell. */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn("w-full border-separate border-spacing-0 caption-bottom text-body leading-normal", className)} {...props} />
    </div>
  )
}
export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("bg-secondary", className)} {...props} />
}
export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child>td]:border-b-0", className)} {...props} />
}
/** Hover fills the whole row with surface-2; `data-state="selected"` uses accent (and a deeper accent on hover), as `dtb-row.is-active`. */
export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return <tr className={cn("transition-colors hover:bg-secondary data-[state=selected]:bg-accent data-[state=selected]:hover:bg-[color-mix(in_srgb,var(--primary)_13%,var(--card))]", className)} {...props} />
}
export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn("h-auto border-b bg-secondary px-[7px] py-2 text-left align-middle text-label font-bold tracking-[0.05em] whitespace-nowrap text-subtle-foreground uppercase select-none first:pl-3.5 last:pr-3.5", className)} {...props} />
}
export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("border-b px-[7px] py-2.5 align-middle text-body leading-[1.45] first:pl-3.5 last:pr-3.5", tableSoftBorder, className)} {...props} />
}
export function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption className={cn("mt-4 text-caption text-muted-foreground", className)} {...props} />
}
export function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot className={cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />
}
