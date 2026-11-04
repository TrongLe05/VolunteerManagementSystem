"use client"

// @dthu/ui 0.2.0 · block-dashboard
import * as React from "react"
import { cn } from "@/lib/utils"
import { bdTokens } from "./tokens"

export interface DashboardScheduleEvent { id: string; time: string; title: string; place?: string; /** Column of the event; defaults to the first leader. */ leaderId?: string; /** "S" (morning) or "C" (afternoon); defaults to the time of day. */ session?: "S" | "C" }
export interface DashboardWeekDay { id: string; label: string; date: string; today?: boolean; /** A day already gone: collapsed into one "Hiển thị" row while it has no events. */ past?: boolean; /** Saturday/Sunday rows get the muted background. */ weekend?: boolean; events: DashboardScheduleEvent[] }
export interface DashboardWeekLeader { id: string; name: string; role?: string }

export interface WeekScheduleGridProps {
  title: string
  days: DashboardWeekDay[]
  /** Columns of the grid (one per leader). A single "Lãnh đạo" column is used when omitted. */
  leaders?: DashboardWeekLeader[]
  /** Shown under the grid when the whole week has no events. */
  emptyText?: string
  pastLabel?: string
  className?: string
}

const sessions = ["S", "C"] as const
const sessionOf = (e: DashboardScheduleEvent) => e.session ?? (Number.parseInt(e.time.slice(0, 2), 10) < 12 ? "S" : "C")

const th = "border-b border-l border-(--bd-ke-2) border-l-(--bd-ke) bg-(--bd-mat-2) px-2.5 py-[10px] text-left align-top text-tiny font-semibold whitespace-nowrap text-(--bd-chu-2)"
const td = "min-w-32 border-b border-l border-(--bd-ke) px-[9px] py-[5px] align-top"

/** Weekly leadership schedule (reference `ltl__bang`): day column (76px) + session column (S/C, 24px) + one column per leader. */
export function WeekScheduleGrid({ title, days, leaders = [{ id: "all", name: "Lãnh đạo" }], emptyText = "Tuần này chưa có lịch công tác nào được đăng.", pastLabel = "Ngày đã qua, không có lịch", className }: WeekScheduleGridProps) {
  const [open, setOpen] = React.useState<Set<string>>(() => new Set())
  const empty = days.every((d) => d.events.length === 0)
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  return (
    <div className={cn(bdTokens, className)}>
      <div className="overflow-x-auto">
        <table aria-label={title} className="w-full border-collapse border-t border-(--bd-ke) text-small">
          <thead>
            <tr>
              <th colSpan={2} scope="col" className={cn(th, "border-l-0 text-center tracking-[0.1em] text-(--bd-chu-3) uppercase")}>Ngày</th>
              {leaders.map((l) => (
                <th key={l.id} scope="col" className={th}>{l.name}{l.role ? <span className="mt-px block text-micro font-normal tracking-normal text-(--bd-chu-3) normal-case">{l.role}</span> : null}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const collapsed = !!d.past && d.events.length === 0 && !open.has(d.id)
              const rowBg = d.today ? "bg-(--bd-now)" : d.weekend ? "bg-(--bd-mat-2)" : ""
              const dayCell = (rowSpan?: number) => (
                <th scope="row" rowSpan={rowSpan} className={cn("w-[76px] min-w-[76px] border-b border-(--bd-ke) bg-(--bd-mat-2) text-center align-middle font-normal", collapsed ? "px-1 py-[5px]" : "px-[9px] py-[5px]", d.today && "bg-(--bd-now) shadow-[inset_3px_0_0_var(--bd-t3)]", d.weekend && !d.today && "bg-(--bd-mat-2)")}>
                  <b className="block text-xs font-semibold">{d.label}</b>
                  <span className="font-mono text-caption font-normal text-(--bd-chu-3)">{d.date}</span>
                  {d.today ? <em className="mt-0.5 block text-micro font-bold tracking-[0.08em] text-(--bd-t3) uppercase not-italic">hôm nay</em> : null}
                </th>
              )
              if (collapsed) {
                return (
                  <tr key={d.id}>
                    {dayCell()}
                    <td colSpan={leaders.length + 1} className="border-b border-(--bd-ke) bg-(--bd-mat-2) p-0 align-middle">
                      <button type="button" aria-expanded={false} onClick={() => toggle(d.id)} className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-2.5 py-2 text-left text-xs text-(--bd-chu-3) outline-none hover:text-(--bd-s1) focus-visible:ring-2 focus-visible:ring-ring">{pastLabel}<span className="ml-auto text-label font-semibold text-(--bd-s1)">Hiển thị</span></button>
                    </td>
                  </tr>
                )
              }
              return sessions.map((s, si) => (
                <tr key={d.id + s}>
                  {si === 0 && dayCell(2)}
                  <td className={cn("w-6 min-w-6 border-b border-l border-(--bd-ke) bg-(--bd-mat-2) px-[9px] py-[5px] text-center align-top text-tiny font-bold text-(--bd-mo)", d.today && "bg-(--bd-now)")}>{s}</td>
                  {leaders.map((l, li) => {
                    const evs = d.events.filter((e) => sessionOf(e) === s && (e.leaderId ?? leaders[0]!.id) === l.id)
                    return (
                      <td key={l.id + li} className={cn(td, rowBg)}>
                        {evs.map((e) => (
                          <div key={e.id} className="my-0.5 rounded-sm border-l-[3px] border-(--bd-s1) bg-accent px-2 py-1 text-xs text-accent-foreground"><b className="font-mono font-semibold">{e.time}</b> {e.title}{e.place && <span className="block text-(--bd-chu-3)">{e.place}</span>}</div>
                        ))}
                      </td>
                    )
                  })}
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
      {empty && <p className="m-0 flex items-center justify-center gap-2.5 border-t border-(--bd-ke) px-[18px] py-[22px] text-center text-body text-(--bd-chu-3)">{emptyText}</p>}
    </div>
  )
}
