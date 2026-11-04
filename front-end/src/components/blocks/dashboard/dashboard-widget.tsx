"use client"

// @dthu/ui 0.2.0 · block-dashboard
import * as React from "react"
import { EyeOff, RefreshCw, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { bdTokens } from "./tokens"

export interface DashboardWidgetMenuItem { id: string; label: string; disabled?: boolean; destructive?: boolean; icon?: React.ReactNode; separatorBefore?: boolean }
export interface DashboardWidgetProps {
  title?: React.ReactNode
  /** Small muted text next to the title. */
  subtitle?: React.ReactNode
  /** Extra content on the right of the header (date, pager, link...). Sits before the "⋯" button. */
  actions?: React.ReactNode
  /** Items of the "⋯" menu; pass `[]` to hide the button. */
  menuItems?: DashboardWidgetMenuItem[]
  onMenuSelect?: (id: string) => void
  /** Accessible name of the "⋯" button (defaults to "Tùy chọn widget"). */
  menuLabel?: string
  /** Remove the card chrome (used by the stat row). The "⋯" button then only shows on hover. */
  bare?: boolean
  /** Replace the body padding (`14px 18px 18px`). */
  bodyClassName?: string
  headerClassName?: string
  /** Customize mode: a bar (drag handle, name, size toggle, menu) shown on top while the widget content becomes inert. */
  editBar?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** Menu of the reference widgets: reload, options, hide. */
export const defaultWidgetMenu: DashboardWidgetMenuItem[] = [
  { id: "reload", label: "Tải lại", icon: <RefreshCw /> },
  { id: "options", label: "Tùy chọn…", icon: <SlidersHorizontal /> },
  { id: "hide", label: "Ẩn widget này", icon: <EyeOff />, destructive: true, separatorBefore: true },
]

/**
 * Card wrapper of a dashboard widget (`kw--the`): header row (title 14.5/600 + note 12px, baseline gap 10, padding 16 18 0 and 46px
 * on the right for the menu), body 14/18/18 and the "⋯" button (30x30, top/right 10) with a 176px menu.
 */
export function DashboardWidget({ title, subtitle, actions, menuItems = defaultWidgetMenu, onMenuSelect, menuLabel = "Tùy chọn widget", bare, bodyClassName, headerClassName, editBar, children, className }: DashboardWidgetProps) {
  const hasMenu = menuItems.length > 0 && !editBar
  const body = <div className={cn("px-[18px] pt-3.5 pb-[18px]", bodyClassName)}>{children}</div>
  const menu = hasMenu && (
    <div className={cn("absolute z-[2]", bare ? "top-1.5 right-1.5 opacity-0 transition-opacity duration-[120ms] group-focus-within/w:opacity-100 group-hover/w:opacity-100 has-[[data-state=open]]:opacity-100" : "top-2.5 right-2.5")}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" aria-label={menuLabel} title={menuLabel} className={cn("grid size-[30px] cursor-pointer place-items-center rounded-md border-0 p-0 text-title leading-none text-subtle-foreground outline-none transition-colors duration-[120ms] hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary max-md:size-10", bare ? "bg-(--bd-mat)" : "bg-transparent")}>⋯</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44">
          {menuItems.map((m) => (
            <React.Fragment key={m.id}>
              {m.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem disabled={m.disabled} variant={m.destructive ? "destructive" : "default"} onSelect={() => onMenuSelect?.(m.id)}>{m.icon}{m.label}</DropdownMenuItem>
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
  const inert = editBar ? { inert: true, className: "pointer-events-none select-none opacity-[.92]" } : { className: undefined }
  if (bare) return <section className={cn(bdTokens, "group/w relative min-w-0", className)}>{editBar}{menu}<div {...inert}>{children}</div></section>
  return (
    <Card className={cn(bdTokens, "group/w relative min-w-0 gap-0 pb-0", className)}>
      {editBar}
      {menu}
      <div {...inert}>
      {(title || subtitle || actions) && (
        <div className={cn("flex flex-wrap items-baseline gap-x-2.5 gap-y-1 px-[18px] pt-4", hasMenu && "pr-[46px]", headerClassName)}>
          {title ? <h2 className="m-0 min-w-0 text-emph leading-[1.2] font-semibold tracking-[-0.01em] text-muted-foreground dark:text-foreground">{title}</h2> : null}
          {subtitle ? <span className="text-xs text-(--bd-chu-3)">{subtitle}</span> : null}
          {actions ? <div className="ml-auto flex items-center gap-2 self-center">{actions}</div> : null}
        </div>
      )}
      {body}
      </div>
    </Card>
  )
}
