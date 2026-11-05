"use client"

// @dthu/ui 0.2.0 · carousel
import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import type { UseEmblaCarouselType } from "embla-carousel-react"
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useUiConfig } from "@/lib/ui-config"

export type CarouselApi = UseEmblaCarouselType[1]
type CarouselOptions = NonNullable<Parameters<typeof useEmblaCarousel>[0]>

/** Số slide hiển thị cùng lúc theo từng breakpoint (mobile-first, mỗi giá trị 1..6). */
export interface CarouselSlidesPerView { base?: number; sm?: number; md?: number; lg?: number; xl?: number }

interface CarouselContextValue {
  viewportRef: ReturnType<typeof useEmblaCarousel>[0]
  api: CarouselApi
  orientation: "horizontal" | "vertical"
  slidesPerView: CarouselSlidesPerView
  canPrev: boolean
  canNext: boolean
  scrollPrev: () => void
  scrollNext: () => void
  selectedIndex: number
  snapCount: number
}
const CarouselContext = React.createContext<CarouselContextValue | null>(null)
function useCarousel() {
  const ctx = React.useContext(CarouselContext)
  if (!ctx) throw new Error("Các thành phần Carousel* phải nằm trong <Carousel>")
  return ctx
}

export interface CarouselProps extends React.ComponentProps<"div"> {
  /** Hướng cuộn. */
  orientation?: "horizontal" | "vertical"
  /** Lặp vòng khi tới cuối. */
  loop?: boolean
  /** Số slide hiển thị cùng lúc: một số hoặc theo breakpoint, ví dụ `{ base: 1, md: 2, lg: 3 }`. Mặc định 1. */
  slidesPerView?: number | CarouselSlidesPerView
  /** Tuỳ chọn truyền thẳng cho embla-carousel (align, dragFree, slidesToScroll...). */
  opts?: CarouselOptions
  /** Nhận về đối tượng embla API (để điều khiển từ ngoài). */
  setApi?: (api: NonNullable<CarouselApi>) => void
  /** Nhãn truy cập của carousel. */
  "aria-label"?: string
}

/**
 * Carousel dựa trên embla-carousel-react: nút trước / sau, chấm trang, bàn phím (mũi tên), vuốt cảm ứng,
 * lặp vòng, hướng ngang / dọc và số slide hiển thị theo breakpoint. Không tự chạy (không autoplay).
 * Ghép: `Carousel > CarouselContent > CarouselItem`, kèm `CarouselPrevious`, `CarouselNext`, `CarouselDots`.
 */
export function Carousel({ orientation = "horizontal", loop = false, slidesPerView = 1, opts, setApi, className, children, onKeyDownCapture, ...props }: CarouselProps) {
  const [viewportRef, api] = useEmblaCarousel({ ...opts, loop: opts?.loop ?? loop, axis: orientation === "horizontal" ? "x" : "y" })
  const [canPrev, setCanPrev] = React.useState(false)
  const [canNext, setCanNext] = React.useState(false)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [snapCount, setSnapCount] = React.useState(0)
  const spv = typeof slidesPerView === "number" ? { base: slidesPerView } : slidesPerView

  const sync = React.useCallback((a: NonNullable<CarouselApi>) => {
    setCanPrev(a.canScrollPrev())
    setCanNext(a.canScrollNext())
    setSelectedIndex(a.selectedScrollSnap())
    setSnapCount(a.scrollSnapList().length)
  }, [])
  React.useEffect(() => {
    if (!api) return
    sync(api)
    setApi?.(api)
    api.on("reInit", sync).on("select", sync)
    return () => { api.off("reInit", sync).off("select", sync) }
  }, [api, sync, setApi])

  const scrollPrev = React.useCallback(() => api?.scrollPrev(), [api])
  const scrollNext = React.useCallback(() => api?.scrollNext(), [api])
  const value = React.useMemo(() => ({ viewportRef, api, orientation, slidesPerView: spv, canPrev, canNext, scrollPrev, scrollNext, selectedIndex, snapCount }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [viewportRef, api, orientation, JSON.stringify(spv), canPrev, canNext, scrollPrev, scrollNext, selectedIndex, snapCount])

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    onKeyDownCapture?.(e)
    if (e.defaultPrevented) return
    const [prevKey, nextKey] = orientation === "horizontal" ? ["ArrowLeft", "ArrowRight"] : ["ArrowUp", "ArrowDown"]
    const target = e.target as HTMLElement
    if (target.closest("input, textarea, select, [contenteditable=true]")) return
    if (e.key === prevKey) { e.preventDefault(); scrollPrev() }
    else if (e.key === nextKey) { e.preventDefault(); scrollNext() }
    else if (e.key === "Home") { e.preventDefault(); api?.scrollTo(0) }
    else if (e.key === "End") { e.preventDefault(); api?.scrollTo(Math.max(snapCount - 1, 0)) }
  }

  return (
    <CarouselContext value={value}>
      <div data-slot="carousel" role="region" aria-roledescription="carousel" onKeyDownCapture={onKey} className={cn("relative", className)} {...props}>
        {children}
      </div>
    </CarouselContext>
  )
}

const IndexContext = React.createContext({ index: 0, count: 1 })

/** Vùng cuộn chứa các `CarouselItem`. Focus được để điều khiển bằng bàn phím. */
export function CarouselContent({ className, children, ...props }: React.ComponentProps<"div">) {
  const { viewportRef, orientation } = useCarousel()
  const items = React.Children.toArray(children)
  return (
    <div ref={viewportRef} data-slot="carousel-viewport" tabIndex={0} aria-live="polite" className="overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <div data-slot="carousel-content" className={cn("flex", orientation === "horizontal" ? "-ml-3" : "-mt-3 flex-col", className)} {...props}>
        {items.map((child, i) => <IndexContext key={React.isValidElement(child) && child.key != null ? child.key : i} value={{ index: i, count: items.length }}>{child}</IndexContext>)}
      </div>
    </div>
  )
}

// Tailwind cần tên lớp đầy đủ, nên liệt kê tường minh.
const BASIS: Record<keyof CarouselSlidesPerView, Record<number, string>> = {
  base: { 1: "basis-full", 2: "basis-1/2", 3: "basis-1/3", 4: "basis-1/4", 5: "basis-1/5", 6: "basis-1/6" },
  sm: { 1: "sm:basis-full", 2: "sm:basis-1/2", 3: "sm:basis-1/3", 4: "sm:basis-1/4", 5: "sm:basis-1/5", 6: "sm:basis-1/6" },
  md: { 1: "md:basis-full", 2: "md:basis-1/2", 3: "md:basis-1/3", 4: "md:basis-1/4", 5: "md:basis-1/5", 6: "md:basis-1/6" },
  lg: { 1: "lg:basis-full", 2: "lg:basis-1/2", 3: "lg:basis-1/3", 4: "lg:basis-1/4", 5: "lg:basis-1/5", 6: "lg:basis-1/6" },
  xl: { 1: "xl:basis-full", 2: "xl:basis-1/2", 3: "xl:basis-1/3", 4: "xl:basis-1/4", 5: "xl:basis-1/5", 6: "xl:basis-1/6" },
}
const VBASIS: Record<number, string> = { 1: "basis-full", 2: "basis-1/2", 3: "basis-1/3" }

/** Một slide. Số slide hiển thị cùng lúc lấy từ `slidesPerView` của `Carousel`; `className` có thể ghi đè (ví dụ `basis-1/3`). */
export function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation, slidesPerView } = useCarousel()
  const { index, count } = React.useContext(IndexContext)
  const basis = orientation === "vertical"
    ? VBASIS[slidesPerView.base ?? 1] ?? "basis-full"
    : (Object.keys(BASIS) as (keyof CarouselSlidesPerView)[]).map((bp) => { const n = slidesPerView[bp]; return n ? BASIS[bp][n] : undefined })
  return (
    <div
      data-slot="carousel-item" role="group" aria-roledescription="slide" aria-label={`${index + 1} / ${count}`}
      className={cn("min-w-0 shrink-0 grow-0", basis, orientation === "horizontal" ? "pl-3" : "pt-3", className)}
      {...props}
    />
  )
}

/** Nút lùi một slide. */
export function CarouselPrevious({ className, variant = "outline", size = "icon", ...props }: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canPrev } = useCarousel()
  const { labels } = useUiConfig()
  const Icon = orientation === "horizontal" ? ArrowLeft : ArrowUp
  return (
    <Button
      data-slot="carousel-previous" variant={variant} size={size} aria-label={labels.carouselPrev} disabled={!canPrev} onClick={scrollPrev}
      className={cn("absolute z-[1] size-10 rounded-full bg-background/90 shadow-md", orientation === "horizontal" ? "top-1/2 left-2 -translate-y-1/2" : "-top-12 left-1/2 -translate-x-1/2", className)}
      {...props}
    ><Icon /></Button>
  )
}

/** Nút tiến một slide. */
export function CarouselNext({ className, variant = "outline", size = "icon", ...props }: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canNext } = useCarousel()
  const { labels } = useUiConfig()
  const Icon = orientation === "horizontal" ? ArrowRight : ArrowDown
  return (
    <Button
      data-slot="carousel-next" variant={variant} size={size} aria-label={labels.carouselNext} disabled={!canNext} onClick={scrollNext}
      className={cn("absolute z-[1] size-10 rounded-full bg-background/90 shadow-md", orientation === "horizontal" ? "top-1/2 right-2 -translate-y-1/2" : "-bottom-12 left-1/2 -translate-x-1/2", className)}
      {...props}
    ><Icon /></Button>
  )
}

/** Chấm chọn trang; mỗi chấm tương ứng một vị trí cuộn. */
export function CarouselDots({ className, ...props }: React.ComponentProps<"div">) {
  const { api, selectedIndex, snapCount } = useCarousel()
  const { labels } = useUiConfig()
  if (snapCount <= 1) return null
  return (
    <div data-slot="carousel-dots" role="group" aria-label={labels.carouselDots} className={cn("mt-3 flex flex-wrap items-center justify-center gap-1", className)} {...props}>
      {Array.from({ length: snapCount }, (_, i) => (
        <button
          key={i} type="button" aria-label={labels.carouselGoTo(i + 1)} aria-current={i === selectedIndex ? "true" : undefined} onClick={() => api?.scrollTo(i)}
          className="group/dot flex size-6 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className={cn("block h-2 rounded-full transition-[width,background-color]", i === selectedIndex ? "w-5 bg-primary" : "w-2 bg-border group-hover/dot:bg-muted-foreground")} />
        </button>
      ))}
    </div>
  )
}
