"use client"

// @dthu/ui 0.2.0 · layout
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { breakpoints, type Breakpoint } from "@/lib/use-breakpoint"
import { useUiConfig } from "@/lib/ui-config"

interface LayoutContextValue { registerSider: () => () => void }
const LayoutContext = React.createContext<LayoutContextValue | null>(null)

export interface LayoutProps extends React.ComponentProps<"div"> {
  /** Ép buộc xếp ngang (có Sider). Thường không cần: Layout tự nhận khi chứa `LayoutSider`. */
  hasSider?: boolean
}

/** Khung bố cục trang kiểu antd. Tự xếp theo hàng khi bên trong có `LayoutSider`, ngược lại xếp theo cột (Header, Content, Footer). Lồng được nhiều tầng. */
export function Layout({ hasSider, className, children, ...props }: LayoutProps) {
  const [registered, setRegistered] = React.useState(0)
  const ctx = React.useMemo<LayoutContextValue>(() => ({
    registerSider: () => { setRegistered((n) => n + 1); return () => setRegistered((n) => n - 1) },
  }), [])
  const direct = React.Children.toArray(children).some((c) => React.isValidElement(c) && c.type === LayoutSider)
  const row = hasSider ?? (direct || registered > 0)
  return (
    <LayoutContext.Provider value={ctx}>
      <div data-slot="layout" data-has-sider={row ? "" : undefined} className={cn("flex min-h-0 min-w-0 flex-auto bg-background text-foreground", row ? "flex-row" : "flex-col", className)} {...props}>
        {children}
      </div>
    </LayoutContext.Provider>
  )
}

/** Thanh đầu trang (thẻ `header`), cao 64px, nền thẻ và viền dưới. */
export function LayoutHeader({ className, ...props }: React.ComponentProps<"header">) {
  return <header data-slot="layout-header" className={cn("flex h-16 shrink-0 items-center gap-3 border-b bg-card px-6 text-card-foreground", className)} {...props} />
}

/** Vùng nội dung chính (thẻ `main`), chiếm phần còn lại của Layout. */
export function LayoutContent({ className, ...props }: React.ComponentProps<"main">) {
  return <main data-slot="layout-content" className={cn("min-h-0 min-w-0 flex-auto", className)} {...props} />
}

/** Chân trang (thẻ `footer`). */
export function LayoutFooter({ className, ...props }: React.ComponentProps<"footer">) {
  return <footer data-slot="layout-footer" className={cn("shrink-0 border-t bg-card px-6 py-4 text-small text-muted-foreground", className)} {...props} />
}

export interface LayoutSiderProps extends Omit<React.ComponentProps<"aside">, "onChange"> {
  /** Cho phép thu gọn: hiện nút bật/tắt ở chân thanh bên. */
  collapsible?: boolean
  /** Trạng thái thu gọn (điều khiển từ ngoài). */
  collapsed?: boolean
  /** Trạng thái thu gọn ban đầu (không điều khiển). */
  defaultCollapsed?: boolean
  /** Gọi khi thu gọn/mở rộng; `type` cho biết do bấm nút hay do điểm ngắt responsive. */
  onCollapse?: (collapsed: boolean, type: "clickTrigger" | "responsive") => void
  /** Chiều rộng khi mở (px hoặc chuỗi CSS). Mặc định 240. */
  width?: number | string
  /** Chiều rộng khi thu gọn (px hoặc chuỗi CSS). Mặc định 64; đặt 0 để ẩn hẳn. */
  collapsedWidth?: number | string
  /** Tự thu gọn khi màn hình hẹp hơn điểm ngắt này (xs…xxl), mở lại khi rộng hơn. */
  breakpoint?: Breakpoint
  /** Nút bật/tắt tuỳ chỉnh; `null` để ẩn nút mặc định. */
  trigger?: React.ReactNode
  /** Đảo chiều mũi tên của nút mặc định (dùng cho Sider đặt bên phải). */
  reverseArrow?: boolean
  /** Giao diện: "light" (nền thẻ) hoặc "dark" (nền xanh navy `bg-sidebar`). Mặc định "dark". */
  theme?: "light" | "dark"
  /** Nhãn truy cập của nút bật/tắt khi đang mở. @default Thu gọn thanh bên */
  collapseLabel?: string
  /** Nhãn truy cập của nút bật/tắt khi đang thu gọn. @default Mở rộng thanh bên */
  expandLabel?: string
}

const px = (v: number | string) => (typeof v === "number" ? `${v}px` : v)

/** Thanh bên của Layout (thẻ `aside`): thu gọn được, tự thu gọn theo `breakpoint`, có nút bật/tắt. */
export function LayoutSider({
  collapsible, collapsed: collapsedProp, defaultCollapsed = false, onCollapse, width = 240, collapsedWidth = 64, breakpoint, trigger,
  reverseArrow, theme = "dark", collapseLabel, expandLabel, className, style, children, id, ...props
}: LayoutSiderProps) {
  const { labels } = useUiConfig()
  const layout = React.useContext(LayoutContext)
  React.useEffect(() => layout?.registerSider(), [layout])
  const generatedId = React.useId()
  const panelId = id ?? generatedId
  const [inner, setInner] = React.useState(defaultCollapsed)
  const controlled = collapsedProp !== undefined
  const collapsed = controlled ? collapsedProp : inner
  const set = (next: boolean, type: "clickTrigger" | "responsive") => { if (!controlled) setInner(next); onCollapse?.(next, type) }
  const latest = React.useRef({ collapsed, set })
  latest.current = { collapsed, set }

  React.useEffect(() => {
    if (!breakpoint || typeof window.matchMedia !== "function") return
    const mql = window.matchMedia(`(max-width: ${breakpoints[breakpoint] - 0.02}px)`)
    const apply = () => { if (mql.matches !== latest.current.collapsed) latest.current.set(mql.matches, "responsive") }
    apply()
    mql.addEventListener("change", apply)
    return () => mql.removeEventListener("change", apply)
  }, [breakpoint])

  const w = px(collapsed ? collapsedWidth : width)
  const dark = theme === "dark"
  const Arrow = (collapsed !== !!reverseArrow) ? ChevronRight : ChevronLeft
  const showTrigger = collapsible && trigger !== null
  return (
    <aside
      id={panelId}
      data-slot="layout-sider"
      data-collapsed={collapsed ? "" : undefined}
      data-theme={theme}
      className={cn(
        "relative flex shrink-0 flex-col transition-[width,min-width,max-width] duration-200 motion-reduce:transition-none",
        dark ? "bg-sidebar text-sidebar-foreground" : "border-r bg-card text-card-foreground",
        className,
      )}
      style={{ width: w, minWidth: w, maxWidth: w, ...style }}
      {...props}
    >
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-2">{children}</div>
      {showTrigger && (
        trigger !== undefined ? (
          <div data-slot="layout-sider-trigger">{trigger}</div>
        ) : (
          <button
            type="button"
            data-slot="layout-sider-trigger"
            aria-label={collapsed ? (expandLabel ?? labels.expandSider) : (collapseLabel ?? labels.collapseSider)}
            aria-expanded={!collapsed}
            aria-controls={panelId}
            onClick={() => set(!collapsed, "clickTrigger")}
            className={cn(
              "flex h-12 shrink-0 cursor-pointer items-center justify-center border-t transition-colors outline-none focus-visible:shadow-focus coarse:min-h-11 [&_svg]:size-4",
              dark ? "border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" : "hover:bg-accent hover:text-accent-foreground",
            )}
          >
            <Arrow aria-hidden="true" />
          </button>
        )
      )}
    </aside>
  )
}
