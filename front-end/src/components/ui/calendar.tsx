"use client"

// @dthu/ui 0.2.0 · calendar
import * as React from "react"
import { DayPicker } from "react-day-picker"
import { vi } from "react-day-picker/locale"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUiConfig } from "@/lib/ui-config"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

/*
 * 1:1 with the reference date popup: padding 10, month + year as ghost dropdowns (13px/600, hover surface-3) centred between two 28px
 * bordered arrow buttons (50% opacity), weekday names 11.5px ink-faint, 32px day cells at 13px, today = accent fill,
 * selected = primary fill / white text, outside days muted, range middle = accent band.
 */
export function Calendar({ className, classNames, showOutsideDays = true, captionLayout = "dropdown", startMonth, endMonth, ...props }: CalendarProps) {
  const { locale, labels } = useUiConfig()
  const thisYear = new Date().getFullYear()
  return (
    <DayPicker
      locale={locale.startsWith("vi") ? vi : undefined}
      showOutsideDays={showOutsideDays}
      captionLayout={captionLayout}
      startMonth={startMonth ?? new Date(thisYear - 100, 0)}
      endMonth={endMonth ?? new Date(thisYear + 20, 11)}
      data-slot="calendar"
      className={cn("p-2.5", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex flex-col gap-4",
        month_caption: "flex h-9 items-center justify-center px-9 text-body font-semibold text-foreground",
        dropdowns: "flex items-center justify-center gap-1",
        dropdown_root: "relative inline-flex h-9 items-center rounded-md hover:bg-muted has-[select:focus-visible]:bg-muted has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-primary/25",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        caption_label: "flex h-9 items-center gap-1 rounded-md pr-2.5 pl-2.5 text-body font-semibold text-foreground select-none [&>svg]:size-3.5 [&>svg]:text-subtle-foreground",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: "inline-flex size-7 items-center justify-center rounded-md border border-border bg-transparent p-0 text-foreground opacity-50 transition-opacity outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
        button_next: "inline-flex size-7 items-center justify-center rounded-md border border-border bg-transparent p-0 text-foreground opacity-50 transition-opacity outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-30",
        month_grid: "mt-0 w-full border-collapse",
        weekdays: "flex",
        weekday: "w-8 flex-1 text-center text-label leading-[17px] font-normal text-subtle-foreground",
        week: "mt-2 flex w-full",
        day: "relative size-8 flex-1 p-0 text-center text-body",
        day_button: "inline-flex size-8 items-center justify-center rounded-md p-0 font-normal outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
        selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary",
        today: "[&>button:not(:where([class*=bg-primary]))]:bg-accent [&>button]:text-accent-foreground",
        outside: "[&>button]:text-muted-foreground",
        disabled: "opacity-40",
        range_start: "rounded-l-md bg-accent",
        range_end: "rounded-r-md bg-accent",
        range_middle: "bg-accent [&>button]:rounded-none [&>button]:bg-transparent [&>button]:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      formatters={{
        formatMonthDropdown: (m) => labels.calendarMonth(m.getMonth() + 1),
        formatWeekdayName: (d) => labels.calendarWeekday(d.getDay()),
        ...props.formatters,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="size-4" /> : orientation === "right" ? <ChevronRight className="size-4" /> : <ChevronDown className="size-3.5" />,
      }}
      {...props}
    />
  )
}
