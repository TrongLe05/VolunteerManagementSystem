"use client"

// @dthu/ui 0.2.0 · block-dashboard
import * as React from "react"
import { Dialog as DialogPrimitive, Tabs as TabsPrimitive } from "radix-ui"
import { CalendarDays, CalendarX2, CircleCheckBig, SunMedium, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

export interface WelcomeDialogItem { id: string; title: string; meta?: string }
export interface WelcomeDialogTab {
  id: string
  label: string
  items: WelcomeDialogItem[]
  emptyText?: string
  /** Heading of the panel (defaults to the label). */
  heading?: string
  /** Small text next to the heading, e.g. the long date. */
  subheading?: string
  /** Link at the right of the heading, e.g. "Xem lịch tuần →". */
  linkLabel?: string
  onLink?: () => void
  /** Icon of the tab (defaults to a calendar / check icon by position). */
  icon?: React.ReactNode
}
export interface WelcomeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  greeting?: string
  userName: string
  /** Short date under the greeting, e.g. "Thứ Ba, 20/10/2026". */
  dateLabel?: string
  tabs: WelcomeDialogTab[]
  dontShowAgain?: boolean
  onDontShowAgainChange?: (v: boolean) => void
  startLabel?: string
}

const tabIcons = [<CalendarDays key="a" />, <CircleCheckBig key="b" />]

/**
 * Welcome bulletin shown after sign-in (reference `bt-modal`): 1080 x 86vh card, radius 16, 4px blue gradient bar on top,
 * greeting 18/700 with a sun icon, a 208px vertical tab rail and a footer with "Không hiện lại hôm nay" + the start button.
 * Full screen at <= 768px, where the rail becomes a row of pills.
 */
export function WelcomeDialog({ open, onOpenChange, greeting = "Chào buổi tối", userName, dateLabel, tabs, dontShowAgain = false, onDontShowAgainChange, startLabel = "Bắt đầu làm việc" }: WelcomeDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-overlay bg-[rgba(16,28,44,0.48)] anim-fade" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-overlay flex h-[86vh] max-h-[86vh] w-[min(1080px,94vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-card text-base text-foreground shadow-[0_18px_48px_rgba(10,25,45,0.28)] focus:outline-none anim-pop max-md:top-0 max-md:left-0 max-md:h-dvh max-md:max-h-none max-md:w-screen max-md:translate-x-0 max-md:translate-y-0 max-md:rounded-none"
        >
          <div className="relative flex shrink-0 items-center gap-3 border-b border-border py-[18px] pr-[18px] pl-[22px] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-[linear-gradient(90deg,#003a61,#00568c,#3a9ad9)] before:content-[''] dark:border-border">
            <DialogPrimitive.Title className="min-w-0 pb-0 text-[18px] leading-[1.3] font-bold max-md:text-base">
              <SunMedium aria-hidden className="mr-0.5 inline size-5 align-[-3px] text-[#e0a42a]" /> {greeting}, {userName}
              {dateLabel ? <small className="mt-0.5 block text-body font-medium text-muted-foreground dark:text-muted-foreground">{dateLabel}</small> : null}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Đóng" title="Đóng" className="ml-auto inline-flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-lg border-0 bg-transparent text-muted-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring dark:hover:text-foreground"><X className="size-5" /></DialogPrimitive.Close>
          </div>
          <TabsPrimitive.Root defaultValue={tabs[0]?.id} orientation="vertical" className="grid min-h-0 w-full flex-1 grid-cols-[208px_1fr] max-md:grid-cols-1 max-md:grid-rows-[auto_1fr]">
            <TabsPrimitive.List aria-label="Nội dung bản tin" className="grid min-w-0 content-start gap-[3px] overflow-x-hidden overflow-y-auto border-r border-border bg-secondary px-2.5 py-3 max-md:flex max-md:gap-1.5 max-md:overflow-x-auto max-md:overflow-y-hidden max-md:border-r-0 max-md:border-b max-md:px-2.5 max-md:py-2 dark:bg-secondary">
              {tabs.map((t, i) => (
                <TabsPrimitive.Trigger key={t.id} value={t.id} className="flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 bg-transparent px-[11px] py-2.5 text-left text-base font-semibold whitespace-nowrap text-muted-foreground outline-none hover:bg-card hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary data-[state=active]:bg-[#e6f0f7] data-[state=active]:text-primary max-md:w-auto max-md:shrink-0 max-md:rounded-full max-md:border max-md:border-border max-md:px-[11px] max-md:py-[7px] max-md:text-body dark:data-[state=active]:bg-accent [&_svg]:mx-0.5 [&_svg]:size-[18px] [&_svg]:shrink-0">
                  {t.icon ?? tabIcons[i % tabIcons.length]}<span className="truncate">{t.label}</span>
                </TabsPrimitive.Trigger>
              ))}
            </TabsPrimitive.List>
            <div className="min-h-0 overflow-y-auto px-6 py-5 [scrollbar-gutter:stable] max-md:p-4">
              {tabs.map((t) => (
                <TabsPrimitive.Content key={t.id} value={t.id} className="outline-none focus-visible:rounded-md focus-visible:shadow-focus">
                  <div className="mb-3.5 flex flex-wrap items-baseline gap-2.5">
                    <h3 className="m-0 text-title font-bold">{t.heading ?? t.label}</h3>
                    {t.subheading ? <span className="text-body text-muted-foreground dark:text-muted-foreground">{t.subheading}</span> : null}
                    {t.linkLabel ? <button type="button" onClick={t.onLink} className="ml-auto cursor-pointer border-0 bg-transparent p-0 text-body font-semibold text-primary hover:underline">{t.linkLabel}</button> : null}
                  </div>
                  {t.items.length === 0 ? (
                    <p className="m-0 rounded-xl border border-dashed border-[#cfd8e1] px-4 py-7 text-center text-control text-muted-foreground dark:border-border dark:text-muted-foreground"><CalendarX2 aria-hidden className="mx-auto mb-1 block size-7 text-[#95a3b1]" /> {t.emptyText ?? "Không có mục nào"}</p>
                  ) : (
                    <ul className="m-0 flex list-none flex-col divide-y p-0">
                      {t.items.map((i) => <li key={i.id} className="flex flex-col gap-0.5 border-l-[3px] border-primary/40 py-2.5 pl-3"><span className="text-sm font-medium">{i.title}</span>{i.meta && <span className="text-xs text-muted-foreground dark:text-muted-foreground">{i.meta}</span>}</li>)}
                    </ul>
                  )}
                </TabsPrimitive.Content>
              ))}
            </div>
          </TabsPrimitive.Root>
          <div className="flex shrink-0 flex-wrap items-center gap-3.5 rounded-b-2xl border-t border-border bg-secondary px-[18px] py-2.5 max-md:rounded-none">
            <label className="flex cursor-pointer items-center gap-[9px] py-1 text-base font-medium text-foreground"><Checkbox id="welcome-skip" checked={dontShowAgain} onCheckedChange={(c) => onDontShowAgainChange?.(c === true)} />Không hiện lại hôm nay</label>
            <span className="flex-1" />
            <Button onClick={() => onOpenChange(false)}>{startLabel}</Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
