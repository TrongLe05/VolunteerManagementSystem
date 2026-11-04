"use client"

// @dthu/ui 0.2.0 · block-admin
import * as React from "react"
import { Clock, Lightbulb, Plus, Rocket, Search, ThumbsUp, User, Tag } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Kbd } from "@/components/ui/kbd"

export type FeedbackStatus = "reviewing" | "planned" | "doing" | "done" | "none"
export interface FeedbackItem { id: string; title: string; summary: string; topic: string; status: FeedbackStatus; votes: number; voted?: boolean; author: string; createdAt: string }
export type FeedbackView = "top" | "latest" | "released" | "mine"

export const feedbackStatusLabel: Record<FeedbackStatus, string> = { reviewing: "Đang xem xét", planned: "Sẽ làm", doing: "Đang làm", done: "Đã có", none: "Chưa làm" }
const dot: Record<FeedbackStatus, string> = { reviewing: "bg-[#8a95a2]", planned: "bg-info", doing: "bg-warning", done: "bg-success", none: "bg-border-strong" }

export interface FeedbackBoardPageProps {
  items: FeedbackItem[]
  view: FeedbackView
  onViewChange?: (v: FeedbackView) => void
  statusFilter?: FeedbackStatus | null
  onStatusFilterChange?: (s: FeedbackStatus | null) => void
  search?: string
  onSearchChange?: (v: string) => void
  onVote?: (item: FeedbackItem) => void
  onCreate?: () => void
  yearStats: { sent: number; inProgress: number; released: number; year: number }
  mineStats: { sent: number; voted: number }
}

const views: { value: FeedbackView; label: string; icon: React.ReactNode }[] = [
  { value: "top", label: "Nhiều ủng hộ", icon: <ThumbsUp /> }, { value: "latest", label: "Mới nhất", icon: <Clock /> },
  { value: "released", label: "Đã phát hành", icon: <Rocket /> }, { value: "mine", label: "Góp ý của tôi", icon: <User /> },
]
const howTo: [string, string][] = [
  ["Gửi góp ý", "Ai cũng gửi được; chọn ẩn danh nếu muốn."], ["Xem xét", "Tổ hỗ trợ đọc mọi góp ý trong 3 ngày làm việc."],
  ["Sẽ làm", "Góp ý phù hợp được đưa vào lộ trình; nhiều người ủng hộ thì làm trước."], ["Đang làm", "Đang được phát triển cho đợt cập nhật dự kiến."],
  ["Đã có", "Khi phát hành, người gửi và người ủng hộ đều nhận thông báo."],
]

const card = "rounded-lg border bg-card shadow-sm"
function SideLabel({ children, first }: { children: React.ReactNode; first?: boolean }) { return <div className={cn("px-2.5 pt-2.5 pb-1.5 text-caption font-bold tracking-[0.05em] text-subtle-foreground uppercase", first && "pt-1")}>{children}</div> }
function NavButton({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={cn("flex w-full cursor-pointer items-center gap-[9px] rounded-md px-2.5 py-[7px] text-left text-body outline-none focus-visible:ring-2 focus-visible:ring-ring [&>svg]:mx-px [&>svg]:size-4 [&>svg]:flex-none", active ? "bg-accent font-semibold text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>{children}</button>
}
function StatCell({ n, label, tone }: { n: number; label: string; tone?: "navy" | "teal" }) { return <div><b className={cn("block text-xl leading-[1.2] font-bold tabular-nums", tone === "navy" ? "text-primary" : tone === "teal" ? "text-success" : "text-foreground")}>{n}</b><span className="text-label text-muted-foreground">{label}</span></div> }
const cardTitle = "mb-2 flex items-center gap-1.5 text-label font-bold tracking-[0.05em] text-subtle-foreground uppercase"

/** Feedback ("góp ý") board: nav, list with votes and side stats (reference `gy-*`). */
export function FeedbackBoardPage({ items, view, onViewChange, statusFilter = null, onStatusFilterChange, search, onSearchChange, onVote, onCreate, yearStats, mineStats }: FeedbackBoardPageProps) {
  const [mode, setMode] = React.useState<"list" | "roadmap">("list")
  return (
    <div className="flex h-full min-h-0 flex-col max-[900px]:overflow-auto">
      <header className={cn(card, "mb-2 flex flex-none flex-wrap items-center gap-x-3.5 gap-y-2 px-3.5 py-2")}>
        <span className="grid size-8 flex-none place-items-center rounded-lg bg-accent text-primary"><Lightbulb className="size-[18px]" aria-hidden /></span>
        <div className="min-w-0 flex-[1_1_9rem]"><h2 className="m-0 text-lead font-bold text-foreground">Góp ý cải tiến hệ thống</h2><p className="m-0 truncate text-xs text-muted-foreground">Ủng hộ góp ý bạn cũng cần — góp ý nhiều người ủng hộ được ưu tiên làm trước. Bạn được báo khi góp ý có tiến triển.</p></div>
        <div role="group" aria-label="Chế độ xem" className="ml-auto inline-flex h-9 flex-none overflow-hidden rounded-md border">
          {(["list", "roadmap"] as const).map((m) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={cn("inline-flex cursor-pointer items-center border-r px-[13px] text-control font-semibold whitespace-nowrap outline-none last:border-r-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-info", mode === m ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground")}>{m === "list" ? "Danh sách" : "Lộ trình"}</button>)}
        </div>
        <Button size="toolbar" className="h-9 px-3" onClick={onCreate}><Plus className="size-4" />Gửi góp ý</Button>
      </header>
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[232px_minmax(0,1fr)_300px] [&>*]:min-h-0 lg:[&>*]:overflow-y-auto">
        <nav aria-label="Bộ lọc góp ý" className={cn(card, "px-2 py-2.5")}>
          <SideLabel first>Xem</SideLabel>
          {views.map((v) => <NavButton key={v.value} active={view === v.value} onClick={() => onViewChange?.(v.value)}>{v.icon}{v.label}</NavButton>)}
          <SideLabel>Trạng thái</SideLabel>
          {(Object.keys(feedbackStatusLabel) as FeedbackStatus[]).map((s) => <NavButton key={s} active={statusFilter === s} onClick={() => onStatusFilterChange?.(statusFilter === s ? null : s)}><span className={cn("mx-[5px] size-2 flex-none rounded-full", dot[s])} />{feedbackStatusLabel[s]}</NavButton>)}
          <SideLabel>Chủ đề</SideLabel>
          <NavButton><Tag />Góp ý sản phẩm</NavButton>
        </nav>
        <section className="flex min-w-0 flex-col gap-2 pr-0.5">
          <div className={cn(card, "sticky top-0 z-[2] flex flex-none items-center gap-2 px-2.5 py-[9px]")}>
            <div className="relative flex h-9 min-w-[140px] flex-1 items-center gap-[9px] rounded-md border bg-card px-[11px] focus-within:border-primary focus-within:shadow-focus-field">
              <Search aria-hidden strokeWidth={2.2} className="size-4 flex-none text-subtle-foreground" />
              <input value={search ?? ""} onChange={(e) => onSearchChange?.(e.target.value)} placeholder="Tìm góp ý — gõ trước khi gửi để tránh trùng…" aria-label="Tìm góp ý" className="min-w-[60px] flex-1 border-0 bg-transparent text-sm text-foreground outline-0 placeholder:text-subtle-foreground" />
              <Kbd aria-hidden>/</Kbd>
            </div>
            <span className="flex-none text-xs text-subtle-foreground tabular-nums">{items.length} góp ý</span>
          </div>
          {items.length === 0 ? <EmptyState title="Chưa có góp ý nào" description="Thử bỏ bớt điều kiện lọc, hoặc gửi góp ý đầu tiên." action={<Button size="sm" onClick={onCreate}>Gửi góp ý</Button>} className={cn(card, "gap-0 px-5 py-[38px] [&>div:nth-of-type(1)]:font-bold [&>div:nth-of-type(2)]:mt-[5px] [&>div:nth-of-type(2)]:max-w-[52ch] [&>div:nth-of-type(3)]:mt-3.5")} /> : (
            <ul className={cn(card, "divide-y")}>
              {items.map((it) => (
                <li key={it.id} className="flex gap-3 p-3.5">
                  <button type="button" aria-pressed={!!it.voted} aria-label={`Ủng hộ: ${it.title}`} onClick={() => onVote?.(it)} className={cn("flex h-14 w-12 shrink-0 cursor-pointer flex-col items-center justify-center rounded-md border text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring", it.voted ? "border-primary bg-accent text-primary" : "hover:bg-accent/50")}><ThumbsUp className="size-4" aria-hidden />{it.votes}</button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><span className="text-sm font-semibold">{it.title}</span><Badge variant={it.status === "done" ? "success" : it.status === "doing" ? "warning" : it.status === "planned" ? "info" : "secondary"}>{feedbackStatusLabel[it.status]}</Badge></div>
                    <p className="mt-0.5 line-clamp-2 text-body text-muted-foreground">{it.summary}</p>
                    <div className="mt-1.5 text-xs text-subtle-foreground">{it.topic} · {it.author} · {it.createdAt}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="flex flex-col gap-2">
          <div className={cn(card, "px-3.5 py-3")}><div className={cardTitle}>Góp ý trong năm {yearStats.year}</div><div className="grid grid-cols-3 gap-1.5 text-center"><StatCell n={yearStats.sent} label="đã gửi" /><StatCell n={yearStats.inProgress} label="đang làm / sẽ làm" tone="navy" /><StatCell n={yearStats.released} label="đã có" tone="teal" /></div></div>
          <div className={cn(card, "px-3.5 py-3")}><div className={cardTitle}>Góp ý của tôi<button type="button" onClick={onCreate} className="ml-auto h-6 cursor-pointer rounded-full border-0 bg-transparent p-0 px-[9px] text-label font-semibold tracking-normal text-primary normal-case hover:underline">+ Gửi</button></div><div className="mb-2 grid grid-cols-2 gap-1.5 text-center [&>*]:rounded-md [&>*]:border [&>*]:border-border [&>*]:bg-card [&>*]:px-1 [&>*]:py-1.5"><button type="button" className="cursor-pointer hover:border-primary"><StatCell n={mineStats.sent} label="tôi đã gửi" /></button><div><StatCell n={mineStats.voted} label="tôi ủng hộ" /></div></div>{mineStats.sent === 0 && <p className="m-0 text-small text-subtle-foreground">Bạn chưa gửi góp ý nào.</p>}</div>
          <div className={cn(card, "px-3.5 py-3")}><div className={cardTitle}>Cách xử lý góp ý</div><ol className="m-0 grid list-none gap-2 p-0 text-small text-muted-foreground">{howTo.map(([t, d], i) => <li key={t} className="flex gap-2 leading-[1.45]"><span className="grid size-5 flex-none place-items-center rounded-full bg-accent text-caption font-bold text-primary">{i + 1}</span><div><b className="font-semibold text-foreground">{t}</b> — {d}</div></li>)}</ol></div>
        </aside>
      </div>
    </div>
  )
}
