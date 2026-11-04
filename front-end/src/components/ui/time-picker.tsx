"use client"

// @dthu/ui 0.2.0 · time-picker
import * as React from "react"
import { Clock } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { useUiConfig } from "@/lib/ui-config"

export interface TimePickerProps {
  /** Giờ đang chọn dạng "HH:mm" (24 giờ), điều khiển từ ngoài. */
  value?: string
  /** Giờ ban đầu (không điều khiển). */
  defaultValue?: string
  /** Gọi khi đổi giờ hoặc phút, trả về "HH:mm". */
  onValueChange?: (value: string) => void
  /** Bước phút (1, 5, 10, 15, 30). Mặc định 5. */
  minuteStep?: number
  /** Giờ nhỏ nhất cho phép (0–23). */
  minHour?: number
  /** Giờ lớn nhất cho phép (0–23). */
  maxHour?: number
  disabled?: boolean
  /** Nhãn cho nhóm chọn giờ. */
  "aria-label"?: string
  className?: string
}

const pad = (n: number) => String(n).padStart(2, "0")

/** Chọn giờ theo hai ô giờ/phút (24 giờ), có bước phút. Giá trị dạng "HH:mm". */
export function TimePicker({ value, defaultValue, onValueChange, minuteStep = 5, minHour = 0, maxHour = 23, disabled, className, ...rest }: TimePickerProps) {
  const { labels } = useUiConfig()
  const [inner, setInner] = React.useState(defaultValue ?? "")
  const cur = value ?? inner
  const [h = "", m = ""] = cur ? cur.split(":") : []
  const emit = (hh: string, mm: string) => {
    const v = `${hh || pad(minHour)}:${mm || "00"}`
    if (value === undefined) setInner(v)
    onValueChange?.(v)
  }
  const hours = Array.from({ length: maxHour - minHour + 1 }, (_, i) => pad(minHour + i))
  const mins = Array.from({ length: Math.ceil(60 / minuteStep) }, (_, i) => pad(i * minuteStep)).filter((x) => Number(x) < 60)
  if (m && !mins.includes(m)) mins.push(m), mins.sort()
  return (
    <div role="group" aria-label={rest["aria-label"] ?? labels.pickTime} data-slot="time-picker" className={cn("flex w-full min-w-0 items-center gap-1.5", className)}>
      <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <Select disabled={disabled} value={h} onValueChange={(v) => emit(v, m)}>
        <SelectTrigger aria-label={labels.hour}><SelectValue placeholder="--" /></SelectTrigger>
        <SelectContent>{hours.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
      </Select>
      <span aria-hidden className="font-semibold text-muted-foreground">:</span>
      <Select disabled={disabled} value={m} onValueChange={(v) => emit(h, v)}>
        <SelectTrigger aria-label={labels.minute}><SelectValue placeholder="--" /></SelectTrigger>
        <SelectContent>{mins.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  )
}

export interface DateTimePickerProps {
  /** Ngày giờ đang chọn (điều khiển từ ngoài). */
  value?: Date
  /** Gọi khi đổi ngày hoặc giờ; `undefined` khi bỏ chọn ngày. */
  onChange?: (value: Date | undefined) => void
  /** Bước phút của ô giờ. */
  minuteStep?: number
  disabled?: boolean
  className?: string
}

/** Kết hợp DatePicker và TimePicker để chọn cả ngày lẫn giờ, trả về một `Date`. */
export function DateTimePicker({ value, onChange, minuteStep = 5, disabled, className }: DateTimePickerProps) {
  const { labels } = useUiConfig()
  const time = value ? `${pad(value.getHours())}:${pad(value.getMinutes())}` : undefined
  return (
    <div data-slot="date-time-picker" className={cn("flex w-full flex-col gap-2 sm:flex-row sm:items-center", className)}>
      <DatePicker className="sm:flex-1" disabled={disabled} value={value} aria-label={labels.pickDate} onChange={(d) => {
        if (!d) return onChange?.(undefined)
        const next = new Date(d)
        next.setHours(value?.getHours() ?? 0, value?.getMinutes() ?? 0, 0, 0)
        onChange?.(next)
      }} />
      <TimePicker className="sm:w-48 sm:flex-none" disabled={disabled} minuteStep={minuteStep} value={time} onValueChange={(t) => {
        const [hh = 0, mm = 0] = t.split(":").map(Number)
        const next = value ? new Date(value) : new Date()
        next.setHours(hh, mm, 0, 0)
        onChange?.(next)
      }} />
    </div>
  )
}
