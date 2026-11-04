"use client"

// @dthu/ui 0.2.0 · pagination
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUiConfig } from "@/lib/ui-config"

export interface PaginationProps extends Omit<React.ComponentProps<"nav">, "onChange"> {
  /** Trang hiện tại, bắt đầu từ 1. */
  page: number
  /** Tổng số trang. */
  pageCount: number
  /** Gọi khi người dùng chọn trang khác. */
  onPageChange: (page: number) => void
}

function range(page: number, count: number): (number | "…")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1)
  const s = new Set([1, count, page - 1, page, page + 1].filter((n) => n >= 1 && n <= count))
  const out: (number | "…")[] = []
  let prev = 0
  for (const n of [...s].sort((a, b) => a - b)) { if (n - prev > 1) out.push("…"); out.push(n); prev = n }
  return out
}

/** Reference `do-pt-nut` (footer variant): 28px square, 6px radius, 1px border, selected = solid primary, disabled 40%. */
const nut = "inline-flex h-7 min-w-7 cursor-pointer items-center justify-center rounded-md border px-1.5 font-[inherit] text-body tabular-nums outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:text-subtle-foreground disabled:opacity-40 [&_svg]:size-4"
const nutIdle = "border-border bg-card text-foreground enabled:hover:border-border-strong enabled:hover:bg-secondary"
const nutOn = "border-primary bg-primary font-semibold text-primary-foreground"

/** Phân trang rút gọn (hiện "…" khi nhiều trang; từ 640px trở xuống chỉ còn "trang / tổng"). Là thẻ `nav` có nhãn "Phân trang". */
export function Pagination({ page, pageCount, onPageChange, className, ...props }: PaginationProps) {
  const { labels } = useUiConfig()
  return (
    <nav aria-label={labels.pagination} className={cn("flex min-w-0 items-center gap-1 text-body text-muted-foreground", className)} {...props}>
      <button type="button" className={cn(nut, nutIdle)} aria-label={labels.prevPage} disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft /></button>
      {range(page, pageCount).map((n, i) => n === "…"
        ? <span key={`e${i}`} className="px-1 text-muted-foreground max-[640px]:hidden">…</span>
        : <button key={n} type="button" data-selected={n === page || undefined} className={cn(nut, n === page ? nutOn : nutIdle, "max-[640px]:hidden")} aria-current={n === page ? "page" : undefined} onClick={() => onPageChange(n)}>{n}</button>)}
      <span className="hidden px-1 whitespace-nowrap text-foreground max-[640px]:inline">{page} / {pageCount}</span>
      <button type="button" className={cn(nut, nutIdle)} aria-label={labels.nextPage} disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight /></button>
    </nav>
  )
}
