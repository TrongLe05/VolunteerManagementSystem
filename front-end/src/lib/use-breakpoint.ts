import * as React from "react"

/** Tên các điểm ngắt responsive (giống Ant Design). */
export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "xxl"

/** Chiều rộng tối thiểu (px) tại đó mỗi điểm ngắt bắt đầu có hiệu lực: xs 0, sm 576, md 768, lg 992, xl 1200, xxl 1600. */
export const breakpoints: Record<Breakpoint, number> = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1200, xxl: 1600 }

/** Thứ tự các điểm ngắt từ nhỏ đến lớn. */
export const breakpointOrder: Breakpoint[] = ["xs", "sm", "md", "lg", "xl", "xxl"]

const none: Record<Breakpoint, boolean> = { xs: false, sm: false, md: false, lg: false, xl: false, xxl: false }

function read(): Record<Breakpoint, boolean> {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return none
  const out = { ...none }
  for (const bp of breakpointOrder) out[bp] = window.matchMedia(`(min-width: ${breakpoints[bp]}px)`).matches
  return out
}

/**
 * Trả về các điểm ngắt đang khớp với cửa sổ (`{ xs: true, sm: true, md: false, ... }`); cập nhật khi đổi kích thước.
 * Trên máy chủ và trước khi mount, mọi giá trị là `false`.
 */
export function useBreakpoint(): Record<Breakpoint, boolean> {
  const [screens, setScreens] = React.useState<Record<Breakpoint, boolean>>(none)
  React.useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const update = () => setScreens((prev) => {
      const next = read()
      return breakpointOrder.every((b) => prev[b] === next[b]) ? prev : next
    })
    const lists = breakpointOrder.map((bp) => window.matchMedia(`(min-width: ${breakpoints[bp]}px)`))
    lists.forEach((l) => l.addEventListener("change", update))
    update()
    return () => lists.forEach((l) => l.removeEventListener("change", update))
  }, [])
  return screens
}
