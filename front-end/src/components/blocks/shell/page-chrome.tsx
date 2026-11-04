// @dthu/ui 0.2.0 · block-shell
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Page-level chrome of the list screens, translated from the reference (`kg-dau`, `dtb-tgl`, `dtb-fbtn`, `dtb-fo`).
 * Keep the values in sync with data-table.tsx.
 */

export interface PageHeadProps extends Omit<React.ComponentProps<"header">, "title"> {
  title: React.ReactNode
  /** Short muted line after the title (`kg-ghi-chu`). */
  description?: React.ReactNode
  /** Right-aligned actions on the same row. */
  actions?: React.ReactNode
  /** Content before the title, e.g. a back button. */
  leading?: React.ReactNode
}

/** Title + description header above a list: bordered 9px box, padding 9px 14px, title 15px / 700, note 12px. */
export function PageHead({ title, description, actions, leading, className, ...props }: PageHeadProps) {
  return (
    <header data-slot="page-head" className={cn("flex flex-none flex-col gap-1.5 rounded-lg border bg-card px-3.5 py-[9px]", className)} {...props}>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {leading}
        <h2 className="m-0 min-w-0 truncate text-lead leading-[1.3] font-bold text-foreground">{title}</h2>
        {description && <span className="text-xs text-subtle-foreground">{description}</span>}
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  )
}

const control = "inline-flex h-9 flex-none cursor-pointer items-center gap-[7px] rounded-md border bg-card text-control font-semibold whitespace-nowrap text-muted-foreground outline-none transition-colors hover:border-border-strong hover:text-foreground focus-visible:border-primary focus-visible:shadow-focus-field [&>svg]:size-3.5 [&>svg]:flex-none"

export interface FilterToggleProps extends React.ComponentProps<"button"> {
  /** On state (filter applied). */
  pressed?: boolean
}
/** Toggle chip in the filter row (`dtb-tgl`), e.g. "Việc của tôi", "Quá hạn". */
export function FilterToggle({ pressed, className, type = "button", ...props }: FilterToggleProps) {
  return <button type={type} aria-pressed={pressed} className={cn(control, "px-3", pressed && "border-[color-mix(in_srgb,var(--primary)_22%,var(--card))] bg-accent text-primary hover:text-primary", className)} {...props} />
}

export interface FilterButtonProps extends Omit<React.ComponentProps<"button">, "value"> {
  label?: React.ReactNode
  /** Current value, shown bold after the label. */
  value?: React.ReactNode
}
/** Dropdown-style trigger "Vai trò: **Tất cả** ▾" (`dtb-fbtn`). Children replace the label/value pair (e.g. icon-only). */
export function FilterButton({ label, value, className, children, type = "button", ...props }: FilterButtonProps) {
  return (
    <button type={type} className={cn(control, "px-[11px]", className)} {...props}>
      {children ?? <>{label && <span>{label}:</span>}{value !== undefined && <b className="font-bold text-foreground">{value}</b>}<i className="text-micro opacity-60 not-italic">▾</i></>}
    </button>
  )
}

/** Boxed field with an inline label "Đơn vị:" in front of a borderless control (`dtb-fo`). */
export function FilterField({ label, className, children, ...props }: React.ComponentProps<"div"> & { label: React.ReactNode }) {
  return (
    <div className={cn("relative flex h-9 flex-none items-center rounded-md border bg-card hover:border-border-strong focus-within:border-primary focus-within:shadow-focus-field", className)} {...props}>
      <span className="flex-none pl-[11px] text-control font-semibold whitespace-nowrap text-muted-foreground after:content-[':']">{label}</span>
      {children}
    </div>
  )
}
