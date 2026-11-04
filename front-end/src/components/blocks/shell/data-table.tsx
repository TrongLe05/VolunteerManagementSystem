"use client"

// @dthu/ui 0.2.0 · block-shell
import * as React from "react"
import { ChevronDown, Search, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { tableSoftBorder } from "@/components/ui/table"

export interface Column<T> {
  key: string
  header: React.ReactNode
  cell: (row: T, index: number) => React.ReactNode
  className?: string
  /** Width hint (`<col>`), px number or CSS length. */
  width?: number | string
  /** Horizontal alignment of header and cells. */
  align?: "left" | "center" | "right"
  /** Pin to the right edge while scrolling horizontally (reference `is-sticky-r`). The `__actions` column is pinned by default; pass `false` to opt out. */
  pin?: "left" | "right" | false
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  getRowId: (row: T) => string
  loading?: boolean
  emptyTitle?: React.ReactNode
  emptyDescription?: React.ReactNode
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  pageSizeOptions?: number[]
  /** Extra classes per row, e.g. a coloured left marker for overdue items. */
  rowClassName?: (row: T) => string | undefined
  /** Accessible name for the table; also makes the pagination landmark unique when several tables share a page. */
  label?: string
  /** Tailwind min-width class keeping columns readable; the table scrolls horizontally below it. */
  minWidthClass?: string
  /** Strip rendered between the rows and the page-size footer. */
  footer?: React.ReactNode
  onRowClick?: (row: T) => void
  /** Show "1–20 / 120" after "dòng" in the footer. */
  showRange?: boolean
  /** Extra content at the left of the footer (e.g. a "Tải thêm" button). */
  footerStart?: React.ReactNode
  /** Hide the whole footer (page size + pagination). */
  hideFooter?: boolean
  /** Row density: row padding 6px / 10px (default) / 14px (reference `dtb-density-*`). */
  density?: "compact" | "normal" | "roomy"
  /** Fill every other row with the subtle surface (reference `dtb-striped`). */
  striped?: boolean
  /** Highlight a row as selected/active (accent fill, deeper on hover). */
  isRowSelected?: (row: T) => boolean
  className?: string
}

/** Keyframes of the reference row entrance (`cd-dong-vao`); React hoists and dedupes the tag. */
const keyframes = "@keyframes cd-dong-vao{0%{opacity:0;transform:translateY(3px)}}"

const rowY = { compact: "py-1.5", normal: "py-2.5", roomy: "py-3.5" } as const
const alignCls = { left: "text-left", center: "text-center", right: "text-right" } as const
const SKELETON_WIDTHS = ["72%", "56%", "88%", "44%", "64%"]
/** Left-hand shadow cast by a pinned column while more content remains to scroll into view (`dtb-con-cuon-phai`). */
const pinShadowLeft = "after:pointer-events-none after:absolute after:top-0 after:-bottom-px after:right-0 after:w-2 after:translate-x-full after:bg-[linear-gradient(90deg,rgba(16,20,24,.08),rgba(16,20,24,0))] after:content-['']"
const pinShadow = "before:pointer-events-none before:absolute before:top-0 before:-bottom-px before:left-0 before:w-2 before:-translate-x-full before:bg-[linear-gradient(270deg,rgba(16,20,24,.08),rgba(16,20,24,0))] before:content-['']"

function PageSize({ value, options, onChange }: { value: number; options: number[]; onChange: (n: number) => void }) {
  const [open, setOpen] = React.useState(false)
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button type="button" title="Chọn số dòng hiển thị" aria-label="Chọn số dòng hiển thị" className="inline-flex h-[26px] min-w-[58px] cursor-pointer items-center justify-between rounded-md border border-border-strong bg-card px-2 text-small font-medium text-foreground outline-none transition-[border-color,box-shadow,background-color] hover:border-primary focus-visible:border-primary focus-visible:shadow-focus-field data-[state=open]:border-primary data-[state=open]:shadow-[0_0_0_2px_rgba(0,86,140,.15)]">
          <span className="tabular-nums">{value}</span>
          <ChevronDown className={cn("ml-1 size-3.5 flex-none text-muted-foreground transition-transform duration-[180ms]", open && "rotate-180")} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={4} className="flex min-w-[var(--radix-dropdown-menu-trigger-width)] flex-col gap-0.5 rounded-md border bg-card p-1 shadow-[0_3px_12px_rgba(16,28,44,.1),0_1px_3px_rgba(16,28,44,.07)]">
        {options.map((n) => (
          <DropdownMenuItem key={n} onSelect={() => onChange(n)} className={cn("h-7 cursor-pointer justify-center rounded-sm px-2.5 py-0 text-small font-medium tabular-nums", n === value ? "bg-accent font-semibold text-primary" : "text-foreground data-[highlighted]:bg-secondary data-[highlighted]:text-foreground")}>{n}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Table with sticky header, empty/loading states, pinned action column and a "Hiện N dòng" footer, as used across list screens (reference `dtb`). */
export function DataTable<T>({ columns, rows, getRowId, loading, emptyTitle = "Chưa có dữ liệu", emptyDescription = "Dữ liệu sẽ hiện ở đây khi có.", page = 1, pageSize = 20, total, onPageChange, onPageSizeChange, pageSizeOptions = [10, 20, 25, 50, 100], rowClassName, label, minWidthClass = "min-w-[44rem]", footer, showRange, footerStart, hideFooter, onRowClick, density = "normal", striped, isRowSelected, className }: DataTableProps<T>) {
  const count = total ?? rows.length
  const pageCount = Math.max(1, Math.ceil(count / pageSize))
  const scroller = React.useRef<HTMLDivElement>(null)
  const [moreRight, setMoreRight] = React.useState(false)
  const [scrolledLeft, setScrolledLeft] = React.useState(false)
  const measure = React.useCallback(() => {
    const el = scroller.current
    if (el) { setMoreRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 1); setScrolledLeft(el.scrollLeft > 1) }
  }, [])
  React.useEffect(() => {
    const el = scroller.current
    if (!el) return
    measure()
    if (typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => ro.disconnect()
  }, [measure, columns.length, rows.length])
  const empty = !loading && rows.length === 0
  const pinned = (c: Column<T>) => (c.pin === undefined ? c.key === "__actions" : c.pin === "right")
  const pinnedLeft = (c: Column<T>) => c.pin === "left"
  const lastPinned = columns.map(pinned).lastIndexOf(true)
  const lastPinnedLeft = columns.map(pinnedLeft).lastIndexOf(true)
  const fixedLayout = columns.some((c) => c.width !== undefined)
  // fixed layout needs a floor: declared px widths + 160px for every column without one (so unsized columns never collapse)
  const widthSum = fixedLayout ? columns.reduce((n, c) => n + (typeof c.width === "number" ? c.width : c.width === undefined ? 160 : 0), 0) : undefined
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(count, page * pageSize)
  const cellBase = "px-[7px] first:pl-3.5 last:pr-3.5 max-[575px]:first:pl-3 max-[575px]:last:pr-3"
  const sizes = pageSizeOptions.includes(pageSize) ? pageSizeOptions : [...pageSizeOptions, pageSize].sort((a, b) => a - b)
  return (
    <div className={cn("flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-lg border bg-card text-body leading-normal text-foreground shadow-sm antialiased", className)}>
      <style href="dthu-data-table" precedence="default">{keyframes}</style>
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
        <div ref={scroller} onScroll={measure} className={cn("relative w-full overflow-auto overscroll-none [&::-webkit-scrollbar]:size-2.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-black/12 [&::-webkit-scrollbar-thumb]:bg-clip-padding hover:[&::-webkit-scrollbar-thumb]:bg-black/22 [&::-webkit-scrollbar-track]:bg-transparent", empty ? "flex-none" : "min-h-0 flex-1")}>
          <table aria-label={label} style={widthSum ? { minWidth: widthSum } : undefined} className={cn("m-0 w-full border-separate border-spacing-0", fixedLayout && "table-fixed", !widthSum && minWidthClass)}>
            {columns.some((c) => c.width !== undefined) && <colgroup>{columns.map((c) => <col key={c.key} style={c.width !== undefined ? { width: c.width } : undefined} />)}</colgroup>}
            <thead>
              <tr>
                {columns.map((c, i) => (
                  <th key={c.key} className={cn("sticky top-0 z-[3] border-b bg-secondary py-2 text-left align-middle text-label font-bold tracking-[0.05em] whitespace-nowrap text-subtle-foreground uppercase select-none", cellBase, c.align && alignCls[c.align], pinned(c) && "right-0 z-[4]", pinnedLeft(c) && "left-0 z-[4]", pinned(c) && i === lastPinned && moreRight && pinShadow, pinnedLeft(c) && i === lastPinnedLeft && scrolledLeft && pinShadowLeft, c.className)}>{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className={cn("[&_tr:last-child>td]:border-b-0", striped && "[&_tr:nth-of-type(2n)>td]:bg-secondary")}>
              {loading
                ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} aria-hidden>{columns.map((c, j) => <td key={c.key} className={cn("border-b bg-card align-middle", tableSoftBorder, cellBase, rowY[density])}><Skeleton className="my-[9px] h-3" style={{ width: SKELETON_WIDTHS[(i + j) % SKELETON_WIDTHS.length] }} /></td>)}</tr>
                  ))
                : rows.map((row, i) => {
                    const active = isRowSelected?.(row)
                    return (
                      <tr key={getRowId(row)} data-active={active || undefined} onClick={onRowClick ? () => onRowClick(row) : undefined} style={{ animationDelay: `${Math.min(i, 9) * 20}ms` }} className={cn("group/row animate-[cd-dong-vao_.18s_cubic-bezier(.16,1,.3,1)_backwards] motion-reduce:animate-none", onRowClick && "cursor-pointer", rowClassName?.(row))}>
                        {columns.map((c, j) => (
                          <td key={c.key} className={cn("border-b bg-card align-middle text-body leading-[1.45] group-hover/row:bg-secondary group-data-[active]/row:bg-accent group-data-[active]/row:group-hover/row:bg-[color-mix(in_srgb,var(--primary)_13%,var(--card))]", tableSoftBorder, cellBase, rowY[density], c.align && alignCls[c.align], pinned(c) && "sticky right-0 z-[2]", pinnedLeft(c) && "sticky left-0 z-[2]", pinned(c) && j === lastPinned && moreRight && pinShadow, pinnedLeft(c) && j === lastPinnedLeft && scrolledLeft && pinShadowLeft, c.className)}>{c.cell(row, (page - 1) * pageSize + i)}</td>
                        ))}
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
        {empty && <EmptyState title={emptyTitle} description={emptyDescription} className="min-h-0 flex-1" />}
      </div>
      {footer}
      {!hideFooter && (
        <div className="z-20 flex flex-none flex-wrap items-center justify-between gap-3 border-t bg-secondary px-3.5 py-1.5 text-body text-muted-foreground max-[575px]:justify-center max-[575px]:px-3">
          <div className="flex flex-wrap items-center gap-3.5 max-[575px]:w-full max-[575px]:justify-center">
            <div className="inline-flex items-center gap-1.5 text-small font-normal text-muted-foreground">
              <span>Hiện</span>
              <PageSize value={pageSize} options={sizes} onChange={(n) => onPageSizeChange?.(n)} />
              <span>dòng</span>
            </div>
            {showRange && <span className="text-small tabular-nums"><b className="font-semibold text-foreground">{from}</b>–<b className="font-semibold text-foreground">{to}</b> / <b className="font-semibold text-foreground">{count}</b></span>}
            {footerStart}
          </div>
          <Pagination aria-label={label ? `Phân trang ${label}` : undefined} page={page} pageCount={pageCount} onPageChange={(p) => onPageChange?.(p)} />
        </div>
      )}
    </div>
  )
}

export interface FilterBarProps {
  search?: string
  onSearchChange?: (v: string) => void
  searchPlaceholder?: string
  onRefresh?: () => void
  filters?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

/** Search box + filter slots + actions, the toolbar above every list (reference `dtb-fbar` / `dtb-frow`). Press "/" to focus the search. */
export function FilterBar({ search, onSearchChange, searchPlaceholder = "Tìm kiếm…", onRefresh, filters, actions, className }: FilterBarProps) {
  const input = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role=dialog],[role=menu],[role=listbox]"))) return
      e.preventDefault()
      input.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])
  return (
    <div className={cn("rounded-lg border bg-card px-2.5 py-[9px] shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex h-9 min-w-[140px] max-w-[420px] flex-[1_1_260px] items-center gap-[9px] rounded-md border bg-card px-[11px] focus-within:border-primary focus-within:shadow-focus-field max-[900px]:max-w-none max-[900px]:min-w-0 max-[900px]:flex-auto">
          <Search aria-hidden strokeWidth={2.2} className="size-4 flex-none text-subtle-foreground" />
          <input ref={input} type="text" value={search ?? ""} onChange={(e) => onSearchChange?.(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="min-w-[60px] flex-1 border-0 bg-transparent text-sm text-foreground outline-0 placeholder:text-subtle-foreground" />
          <Kbd aria-hidden>/</Kbd>
        </div>
        {filters}
        <div className="ml-auto flex items-center gap-2">
          {onRefresh && <Button variant="outline" size="icon" aria-label="Làm mới" title="Tải lại" className="h-9 w-[39px] text-muted-foreground hover:text-foreground [&_svg]:size-[17px]" onClick={onRefresh}><RefreshCw /></Button>}
          {actions}
        </div>
      </div>
    </div>
  )
}
export * from "./page-chrome"
