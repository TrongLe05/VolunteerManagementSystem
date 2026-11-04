import * as React from "react"
import { CalendarDays } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useUiConfig } from "@/lib/ui-config"

/* Field look of the reference `do-ngay-ip`: 36px, radius 6, line border, 13.5px, calendar glyph at the right; focus/open = navy border + ring. */
const trigger = "group/dp flex h-9 w-full coarse:h-11 coarse:text-base items-center gap-2 rounded-md border border-input bg-background pr-2.5 pl-[11px] text-left text-control leading-[1.4] text-foreground transition-[border-color,box-shadow] duration-[120ms] outline-none hover:border-muted-foreground focus-visible:border-primary focus-visible:shadow-focus-field data-[state=open]:border-primary data-[state=open]:ring-[3px] data-[state=open]:ring-accent disabled:cursor-not-allowed disabled:bg-secondary disabled:text-subtle-foreground aria-invalid:border-destructive"
/* Footer of the popup: line-soft top border, "Hôm nay" link (`do-ngay-lk`). */
const footer = "flex items-center justify-between border-t border-[color-mix(in_srgb,var(--border)_55%,var(--background))] px-3 py-1.5"
const link = "cursor-pointer rounded-md px-2 py-1 text-small text-primary transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"

export interface DatePickerProps {
  /** Ngày đang chọn (điều khiển từ ngoài). */
  value?: Date
  /** Gọi khi người dùng chọn ngày; `undefined` khi bỏ chọn. */
  onChange?: (date: Date | undefined) => void
  /** Chữ hiện khi chưa chọn ngày. @default Chọn ngày */
  placeholder?: string
  /** Vô hiệu hóa nút chọn. */
  disabled?: boolean
  /** Class bổ sung cho nút. */
  className?: string
  /** Nhãn cho trình đọc màn hình; mặc định dùng `placeholder`. */
  "aria-label"?: string
}

/** Single-date picker. Displays the provider's `dateFormat` (dd/MM/yyyy by default). */
export function DatePicker({ value, onChange, placeholder: placeholderProp, disabled, className, ...rest }: DatePickerProps) {
  const { labels, dateFormat } = useUiConfig()
  const placeholder = placeholderProp ?? labels.pickDate
  const fmt = (d: Date) => format(d, dateFormat)
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" disabled={disabled} aria-label={rest["aria-label"] ?? placeholder} className={cn(trigger, className)}>
          <span className={cn("min-w-0 flex-1 truncate", !value && "text-subtle-foreground")}>{value ? fmt(value) : placeholder}</span>
          <CalendarDays aria-hidden className="size-4 shrink-0 text-subtle-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto overflow-hidden p-0">
        <Calendar mode="single" selected={value} defaultMonth={value} onSelect={(d) => { onChange?.(d); setOpen(false) }} />
        <div className={footer}>
          <button type="button" className={link} onClick={() => { onChange?.(new Date()); setOpen(false) }}>{labels.today}</button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export type DateRange = { from: Date | undefined; to?: Date | undefined }

/** Chọn khoảng ngày (lịch hai tháng). `value` có dạng `{ from, to }`. */
export function DateRangePicker({ value, onChange, placeholder: placeholderProp, className }: {
  value?: DateRange
  onChange?: (r: DateRange | undefined) => void
  /** @default Chọn khoảng ngày */
  placeholder?: string
  className?: string
}) {
  const { labels, dateFormat } = useUiConfig()
  const placeholder = placeholderProp ?? labels.pickDateRange
  const fmt = (d: Date) => format(d, dateFormat)
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" aria-label={placeholder} className={cn(trigger, className)}>
          <span className={cn("min-w-0 flex-1 truncate", !value?.from && "text-subtle-foreground")}>{value?.from ? `${fmt(value.from)}${value.to ? ` – ${fmt(value.to)}` : ""}` : placeholder}</span>
          <CalendarDays aria-hidden className="size-4 shrink-0 text-subtle-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto overflow-hidden p-0">
        <Calendar mode="range" numberOfMonths={2} defaultMonth={value?.from} selected={value} onSelect={onChange} />
      </PopoverContent>
    </Popover>
  )
}
