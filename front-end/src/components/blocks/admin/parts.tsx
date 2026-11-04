"use client"

// @dthu/ui 0.2.0 · block-admin
import * as React from "react"
import { tableSoftBorder } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Search, RefreshCw } from "lucide-react"
import { FilterToggle } from "@/components/blocks/shell/page-chrome"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export interface SegmentedOption<T extends string> { value: T; label: React.ReactNode; count?: number }

/** Segmented switch used in toolbars (reference `do-seg`). `soft` = `do-seg nho` (soft track, white active pill); `solid` = bordered group with a navy active item. Both are 36px high. */
export function AdminSegmented<T extends string>({ value, onChange, options, label, variant = "soft", className }: {
  value: T; onChange?: (v: T) => void; options: SegmentedOption<T>[]; label: string; variant?: "soft" | "solid" | "toggles"; className?: string
}) {
  if (variant === "toggles") {
    // Separate toggle chips (reference `dtb-tgl` / `on-navy`): same look as FilterToggle, the active one filled navy.
    return (
      <div role="group" aria-label={label} className={cn("flex flex-none gap-2", className)}>
        {options.map((o) => (
          <FilterToggle key={o.value} pressed={o.value === value} onClick={() => onChange?.(o.value)} className="aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:text-primary-foreground">{o.label}{o.count !== undefined && <span className={cn("rounded-[9px] px-1.5 py-px font-mono text-label tabular-nums", o.value === value ? "bg-card/25 text-white" : "bg-secondary text-muted-foreground")}>{o.count}</span>}</FilterToggle>
        ))}
      </div>
    )
  }
  return (
    <div role="group" aria-label={label} className={cn("inline-flex h-9 max-w-full flex-none overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", variant === "soft" ? "gap-0.5 rounded-lg bg-secondary p-[3px]" : "rounded-md border", className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange?.(o.value)}
            className={cn(
              "inline-flex flex-none cursor-pointer items-center gap-1.5 whitespace-nowrap outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-info",
              variant === "soft"
                ? cn("rounded-md px-3 text-body", active ? "bg-card font-semibold text-primary shadow-sm" : "font-medium text-muted-foreground hover:bg-card/60 hover:text-foreground")
                : cn("border-r px-[13px] text-control font-semibold last:border-r-0", active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"),
            )}
          >
            {o.label}
            {o.count !== undefined && <span className={cn("rounded-full px-1.5 text-xs", active && variant === "solid" ? "bg-primary-foreground/20" : "bg-muted")}>{o.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** "Label: value" select used in filter bars (reference `dtb-fo`, 36px). Pass a width class (`w-[240px]`) for the fixed-width fields. */
export function AdminFilterSelect({ label, value, onChange, options, allLabel = "Tất cả", className, caret, menu }: {
  caret?: boolean; menu?: boolean; label: string; value: string; onChange?: (v: string) => void; options: { value: string; label: string }[]; allLabel?: string; className?: string
}) {
  if (menu) {
    // Reference `do-btn do-btn--thuong do-btn--bar` + chevron: shows just the label until a value is chosen.
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger aria-label={label} className={cn("h-9 w-auto flex-none gap-1.5 px-3 pr-2.5 text-control font-semibold text-muted-foreground hover:text-foreground", value !== "all" && "border-[color-mix(in_srgb,var(--primary)_22%,var(--background))] bg-accent text-primary", className)}>
          <span className="flex-none whitespace-nowrap">{label}{value !== "all" && <>: <b className="font-bold"><SelectValue /></b></>}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    )
  }
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} label={label} active={value !== "all"} className={cn("h-9 w-auto min-w-0 flex-none gap-1.5", caret && "gap-[7px] pr-[11px] [&>svg]:hidden", className)}>
        <SelectValue />{caret && <i aria-hidden className="text-micro opacity-60 not-italic">▾</i>}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** KPI tile (reference `do-so`): 3px left rule, label 11.5/700 caps, value 22px (monospace for numbers, 17px text otherwise), optional hint. `accent` = teal rule, `active` = selected (queue tiles). */
export function AdminStat({ label, value, hint, active, accent, onClick, className }: {
  label: string; value: React.ReactNode; hint?: React.ReactNode; active?: boolean; accent?: boolean; onClick?: () => void; className?: string
}) {
  const body = (
    <>
      <div className="text-label font-bold tracking-[0.04em] text-subtle-foreground uppercase">{label}</div>
      <div className={cn("mt-1 font-bold text-foreground", typeof value === "number" ? "font-mono text-heading leading-tight" : "text-title leading-[1.6] [&_small]:ml-[3px] [&_small]:text-body [&_small]:font-semibold [&_small]:text-muted-foreground")}>{value}</div>
      {hint && <div className="mt-[3px] text-xs text-muted-foreground">{hint}</div>}
    </>
  )
  const cls = cn("block w-full min-w-0 rounded-lg border border-l-[3px] bg-card px-3.5 pt-[11px] pb-3 text-left shadow-sm", accent && "border-l-success", active && "bg-accent shadow-[inset_0_0_0_1px_#c6d8e7]", onClick && "cursor-pointer outline-none hover:bg-secondary focus-visible:shadow-focus", active && onClick && "hover:bg-accent", className)
  return onClick ? <button type="button" aria-pressed={active} onClick={onClick} className={cls}>{body}</button> : <div className={cls}>{body}</div>
}

export function AdminCode({ children, className }: { children: React.ReactNode; className?: string }) {
  return <code className={cn("font-mono text-xs text-muted-foreground", className)}>{children}</code>
}

/** Page container: toolbar on top, content fills remaining height. The shell's <main> already pads the page; the reference gap between blocks is 6px. */
export function AdminPage({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex h-full min-h-0 flex-col gap-1.5 max-md:overflow-auto", className)}>{children}</div>
}

/** Rounded bar used above tables when FilterBar's search box is not wanted (reference `dtb-fbar`). */
export function AdminToolbar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center gap-2 rounded-lg border bg-card px-2.5 py-[9px] shadow-sm", className)}>{children}</div>
}

/** Toolbar: search + filter row + actions (reference `dtb-fbar` / `dtb-frow`). Press "/" to focus the search (when the hint is shown). */
export function AdminFilterBar({ search, onSearchChange, searchPlaceholder = "Tìm kiếm…", onRefresh, filters, actions, beforeRefresh, hideKbd, hideSearch, refreshIcon, className }: {
  search?: string; onSearchChange?: (v: string) => void; searchPlaceholder?: string; onRefresh?: () => void; filters?: React.ReactNode; actions?: React.ReactNode
  /** Icon buttons placed before the refresh button (the first icon button takes the `ml-auto`). */
  beforeRefresh?: React.ReactNode
  /** Reference screens without the "/" hint in the search box. */
  hideKbd?: boolean
  /** Toolbars without a search box (e.g. the HR sync history). */
  hideSearch?: boolean
  /** Some reference screens use the clockwise "rotate-cw" icon instead of "refresh-cw". */
  refreshIcon?: React.ReactNode; className?: string
}) {
  const input = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => {
    if (hideKbd || hideSearch) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest("[role=dialog],[role=menu],[role=listbox]"))) return
      e.preventDefault()
      input.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [hideKbd, hideSearch])
  return (
    <div className={cn("flex-none rounded-lg border bg-card px-2.5 py-[9px] shadow-sm", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {!hideSearch && <div className="relative flex h-9 min-w-[140px] max-w-[420px] flex-[1_1_260px] items-center gap-[9px] rounded-md border bg-card px-[11px] focus-within:border-primary focus-within:shadow-focus-field max-[900px]:max-w-none max-[900px]:min-w-0 max-[900px]:flex-auto">
          <Search aria-hidden strokeWidth={2.2} className="size-4 flex-none text-subtle-foreground" />
          <input ref={input} type="text" value={search ?? ""} onChange={(e) => onSearchChange?.(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="min-w-[60px] flex-1 border-0 bg-transparent text-sm text-foreground outline-0 placeholder:text-subtle-foreground" />
          {!hideKbd && <Kbd aria-hidden>/</Kbd>}
        </div>}
        {filters}
        <div className="ml-auto flex items-center gap-2">
          {beforeRefresh}
          {onRefresh && <Button variant="outline" size="toolbar-icon" aria-label="Làm mới" title="Tải lại" className="text-muted-foreground hover:text-foreground" onClick={onRefresh}>{refreshIcon ?? <RefreshCw />}</Button>}
          {actions}
        </div>
      </div>
    </div>
  )
}

export const adminPanelClass = "block min-w-0 rounded-lg border bg-card shadow-sm"
const adminTh = "sticky top-0 z-[3] border-b bg-secondary px-[7px] py-2 text-left align-middle text-label font-bold tracking-[0.05em] whitespace-nowrap text-subtle-foreground uppercase select-none first:pl-3.5 last:pr-3.5"
export const adminCell = cn("border-b bg-card px-[7px] py-3 align-middle text-body leading-[1.45] group-hover/row:bg-secondary first:pl-3.5 last:pr-3.5", tableSoftBorder)
export const adminMono = "font-[ui-monospace,'Cascadia_Mono',SFMono-Regular,Consolas,'Liberation_Mono',monospace]"

export function AdminPanel({ title, count, description, action, children, className }: { title: React.ReactNode; count?: number; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn(adminPanelClass, className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 pt-[13px]">
        <div className="min-w-0 flex-[1_1_260px]">
          <h3 className="m-0 flex items-center gap-1.5 text-sm font-bold text-foreground">{title}{count !== undefined && <span className={cn("rounded-[9px] bg-secondary px-1.5 text-caption font-semibold text-muted-foreground", adminMono)}>{count}</span>}</h3>
          {description && <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>}
        </div>
        {action && <div className="flex flex-none items-center gap-2">{action}</div>}
      </div>
      <div className="px-4 pt-3 pb-3.5">{children}</div>
    </section>
  )
}

export function AdminGrid({ cols, minWidth, head, children, label, footer }: { cols: (number | undefined)[]; minWidth: number; head: React.ReactNode[]; children?: React.ReactNode; label: string; footer?: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card text-body leading-normal text-foreground antialiased">
      <div className="relative w-full overflow-auto overscroll-none">
        <table aria-label={label} style={{ minWidth }} className="m-0 w-full border-separate border-spacing-0">
          <colgroup>{cols.map((w, i) => <col key={i} style={w ? { width: w } : undefined} />)}</colgroup>
          <thead><tr>{head.map((h, i) => <th key={i} className={cn(adminTh, i === head.length - 1 && !h && "w-[51px]")}>{h}</th>)}</tr></thead>
          <tbody className="[&_tr:last-child>td]:border-b-0">{children}</tbody>
        </table>
      </div>
      {footer}
    </div>
  )
}

