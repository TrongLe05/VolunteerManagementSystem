"use client"

// @dthu/ui 0.2.0 · sidebar
import * as React from "react"
import { Slot } from "radix-ui"
import { PanelLeft } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/lib/use-media-query"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUiConfig } from "@/lib/ui-config"

/** Chế độ thu gọn: `icon` chỉ còn biểu tượng, `offcanvas` ẩn hẳn ra ngoài khung. */
export type SidebarCollapsible = "icon" | "offcanvas"

interface SidebarContextValue {
  /** `expanded` khi đang mở rộng, `collapsed` khi thu gọn (trên máy tính). */
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  /** Màn hình hẹp (<768px): sidebar hiển thị dạng ngăn trượt (Sheet). */
  isMobile: boolean
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  /** Đóng/mở: ngăn trượt trên mobile, thu gọn/mở rộng trên máy tính. */
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

/** Truy cập trạng thái sidebar hiện tại. Phải dùng bên trong `SidebarProvider`. */
export function useSidebar(): SidebarContextValue {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar phải được dùng bên trong <SidebarProvider>.")
  return ctx
}

export interface SidebarProviderProps extends React.ComponentProps<"div"> {
  /** Trạng thái mở (controlled). Bỏ trống để dùng uncontrolled với `defaultOpen`. */
  open?: boolean
  /** Trạng thái mở ban đầu khi uncontrolled. Mặc định `true`. */
  defaultOpen?: boolean
  /** Gọi khi trạng thái mở thay đổi (kể cả bằng phím tắt Ctrl/Cmd+B). */
  onOpenChange?: (open: boolean) => void
  /** Chiều rộng khi mở rộng. Mặc định `16rem`. */
  width?: string
  /** Chiều rộng khi thu gọn kiểu `icon`. Mặc định `70px`. */
  iconWidth?: string
}

/**
 * Gốc của sidebar: giữ trạng thái đóng/mở (không lưu cookie), lắng nghe Ctrl/Cmd+B.
 * Đặt trong một khung có chiều cao (ví dụ `h-screen`).
 */
export function SidebarProvider({
  open: openProp, defaultOpen = true, onOpenChange, width = "16rem", iconWidth = "70px", className, style, children, ...props
}: SidebarProviderProps) {
  const [openState, setOpenState] = React.useState(defaultOpen)
  const open = openProp ?? openState
  const isMobile = useMediaQuery("(max-width: 767px)")
  const [openMobile, setOpenMobile] = React.useState(false)

  const setOpen = React.useCallback((next: boolean) => {
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }, [openProp, onOpenChange])

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((v) => !v)
    else setOpen(!open)
  }, [isMobile, open, setOpen])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggleSidebar])

  const value = React.useMemo<SidebarContextValue>(() => ({
    state: open ? "expanded" : "collapsed", open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar,
  }), [open, setOpen, isMobile, openMobile, toggleSidebar])

  return (
    <SidebarContext.Provider value={value}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={{ "--sidebar-width": width, "--sidebar-width-icon": iconWidth, ...style } as React.CSSProperties}
          className={cn("flex h-full min-h-0 w-full", className)}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

export interface SidebarProps extends React.ComponentProps<"div"> {
  /** Cạnh đặt sidebar. Mặc định `left`. */
  side?: "left" | "right"
  /** Kiểu thu gọn: `icon` (mặc định) hoặc `offcanvas`. */
  collapsible?: SidebarCollapsible
  /** Tiêu đề đọc được cho ngăn trượt trên mobile (a11y). @default Menu chức năng */
  mobileTitle?: string
}

/** Thanh điều hướng bên. Trên màn hình <768px tự chuyển thành ngăn trượt (Sheet). */
export function Sidebar({ side = "left", collapsible = "icon", mobileTitle, className, children, ...props }: SidebarProps) {
  const { state, isMobile, openMobile, setOpenMobile } = useSidebar()
  const { labels } = useUiConfig()

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side={side}
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) max-w-[85vw] gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground sm:p-0 [&>button]:text-sidebar-foreground"
          style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
        >
          <SheetTitle className="sr-only">{mobileTitle ?? labels.sidebarTitle}</SheetTitle>
          <SheetDescription className="sr-only">{labels.sidebarDescription}</SheetDescription>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  const collapsed = state === "collapsed"
  const mode = collapsed ? collapsible : ""
  return (
    <div
      data-slot="sidebar"
      data-state={state}
      data-mode={mode}
      data-side={side}
      className={cn(
        "group/sidebar relative shrink-0 overflow-hidden bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-linear motion-reduce:transition-none",
        "w-(--sidebar-width) data-[mode=icon]:w-(--sidebar-width-icon) data-[mode=offcanvas]:w-0",
        side === "left" ? "border-r border-sidebar-border data-[mode=offcanvas]:border-r-0" : "order-last border-l border-sidebar-border data-[mode=offcanvas]:border-l-0",
        className,
      )}
      {...props}
    >
      <div
        inert={mode === "offcanvas" ? true : undefined}
        className="flex h-full w-(--sidebar-width) flex-col group-data-[mode=icon]/sidebar:w-(--sidebar-width-icon)"
      >
        {children}
      </div>
    </div>
  )
}

/** Nút đóng/mở sidebar (cũng dùng được làm nút hamburger trên mobile). */
export function SidebarTrigger({ className, onClick, children, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()
  const { labels } = useUiConfig()
  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      aria-label={labels.toggleSidebar}
      onClick={(e) => { onClick?.(e); toggleSidebar() }}
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring max-md:size-10 [&_svg]:size-4", className)}
      {...props}
    >
      {children ?? <PanelLeft />}
    </button>
  )
}

/** Dải mỏng ở mép sidebar: bấm để đóng/mở. */
export function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()
  const { labels } = useUiConfig()
  return (
    <button
      type="button"
      data-slot="sidebar-rail"
      aria-label={labels.toggleSidebar}
      tabIndex={-1}
      title={labels.toggleSidebar}
      onClick={toggleSidebar}
      className={cn("absolute inset-y-0 right-0 z-10 hidden w-2 cursor-col-resize after:absolute after:inset-y-0 after:right-0 after:w-px hover:after:bg-sidebar-ring sm:flex", className)}
      {...props}
    />
  )
}

/** Vùng nội dung chính bên cạnh sidebar. */
export function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return <main data-slot="sidebar-inset" className={cn("relative flex min-w-0 flex-1 flex-col overflow-auto bg-background", className)} {...props} />
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}
export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-footer" className={cn("flex flex-col gap-2 p-2", className)} {...props} />
}
/** Vùng cuộn chứa các nhóm menu. */
export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-content" className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto", className)} {...props} />
}
export function SidebarSeparator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr data-slot="sidebar-separator" className={cn("mx-2 h-px w-auto border-0 bg-sidebar-border", className)} {...props} />
}
export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group" role="group" className={cn("relative flex w-full min-w-0 flex-col p-2", className)} {...props} />
}
/** Nhãn của nhóm; ẩn khi sidebar thu gọn kiểu icon. */
export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-label" className={cn("flex h-8 shrink-0 items-center px-2 text-label font-bold uppercase tracking-[0.05em] text-sidebar-foreground/70 group-data-[mode=icon]/sidebar:hidden", className)} {...props} />
}
export function SidebarGroupContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-group-content" className={cn("w-full text-sm", className)} {...props} />
}
export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu" className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />
}
export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-item" className={cn("group/menu-item relative", className)} {...props} />
}

const menuButtonVariants = cva(
  "flex w-full items-center gap-2 overflow-hidden rounded-md p-2.5 text-left text-control font-medium outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground [&_svg]:size-5 [&_svg]:shrink-0 [&>span:last-child]:truncate group-data-[mode=icon]/sidebar:w-full group-data-[mode=icon]/sidebar:justify-center group-data-[mode=icon]/sidebar:p-0 group-data-[mode=icon]/sidebar:[&>*:not(svg)]:hidden",
  {
    variants: { size: { default: "h-[42px]", sm: "h-9 text-xs", lg: "h-12" } },
    defaultVariants: { size: "default" },
  },
)

export interface SidebarMenuButtonProps extends React.ComponentProps<"button">, VariantProps<typeof menuButtonVariants> {
  /** Biến thẻ con thành nút (ví dụ `<a>` của router). */
  asChild?: boolean
  /** Mục đang được chọn. */
  isActive?: boolean
  /** Chú thích hiện khi sidebar thu gọn kiểu icon. */
  tooltip?: React.ReactNode
}

/** Nút menu của sidebar. Khi thu gọn kiểu icon chỉ còn biểu tượng; `tooltip` hiện nhãn. Bọc nhãn trong `<span>`. */
export function SidebarMenuButton({ asChild = false, isActive = false, tooltip, size, className, ...props }: SidebarMenuButtonProps) {
  const { state, isMobile } = useSidebar()
  const Comp = asChild ? Slot.Root : "button"
  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      {...(asChild ? {} : { type: "button" as const })}
      className={cn(menuButtonVariants({ size }), className)}
      {...props}
    />
  )
  if (!tooltip) return button
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" align="center" hidden={state !== "collapsed" || isMobile}>{tooltip}</TooltipContent>
    </Tooltip>
  )
}

/** Huy hiệu số lượng ở cuối mục menu; ẩn khi thu gọn kiểu icon. */
export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sidebar-menu-badge" className={cn("pointer-events-none absolute top-1/2 right-2 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-md px-1 text-xs font-medium text-sidebar-foreground tabular-nums select-none group-data-[mode=icon]/sidebar:hidden", className)} {...props} />
}
/** Danh sách menu con (thụt vào, có đường kẻ trái); ẩn khi thu gọn kiểu icon. */
export function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul data-slot="sidebar-menu-sub" className={cn("mx-3.5 flex min-w-0 flex-col gap-1 border-l border-sidebar-border px-2.5 py-0.5 group-data-[mode=icon]/sidebar:hidden", className)} {...props} />
}
export function SidebarMenuSubItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li data-slot="sidebar-menu-sub-item" className={cn("relative", className)} {...props} />
}
export function SidebarMenuSubButton({ asChild = false, isActive = false, className, ...props }: React.ComponentProps<"a"> & { asChild?: boolean; isActive?: boolean }) {
  const Comp = asChild ? Slot.Root : "a"
  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-active={isActive}
      aria-current={isActive ? "page" : undefined}
      className={cn("flex h-9 min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 text-body outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground [&>span:last-child]:truncate", className)}
      {...props}
    />
  )
}
