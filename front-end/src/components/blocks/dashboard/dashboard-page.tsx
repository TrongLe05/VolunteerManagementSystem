"use client"

// @dthu/ui 0.2.0 · block-dashboard
import * as React from "react"
import { Check, ChevronDown, EyeOff, LayoutGrid, Maximize2, Minimize2, Plus, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DashboardWidget, defaultWidgetMenu, type DashboardWidgetMenuItem } from "./dashboard-widget"
import { LineChart, type LineChartProps } from "./line-chart"
import { StatCard, type StatCardProps } from "./stat-card"
import { bdTokens } from "./tokens"
import { WeekScheduleGrid, type DashboardScheduleEvent, type DashboardWeekDay, type DashboardWeekLeader } from "./week-schedule"

export interface DashboardNotification { id: string; title: string; sender: string; time: string; unread?: boolean }
export interface DashboardPendingInfo { emptyTitle: string; emptyHint: string; count?: number }
export type DashboardWidgetId = "stats" | "chart" | "pending" | "week" | "today" | "notifications"
export type DashboardZone = "top" | "main" | "side"
export interface DashboardLayoutPreset { id: string; name: string; hidden: DashboardWidgetId[]; /** Small caption under the name, e.g. "Mặc định". */ note?: string }
/** Serialised layout handed to `onSaveLayout`. */
export interface DashboardLayoutState { zones: Record<DashboardZone, DashboardWidgetId[]>; hidden: DashboardWidgetId[]; half: DashboardWidgetId[] }

export const dashboardDefaultLayouts: DashboardLayoutPreset[] = [
  { id: "school", name: "Mẫu của trường", hidden: [], note: "Mặc định" },
  { id: "compact", name: "Gọn nhẹ", hidden: ["pending", "week"] },
  { id: "schedule", name: "Tập trung lịch", hidden: ["chart", "notifications"] },
]

const widgetTitles: Record<DashboardWidgetId, string> = { stats: "Chỉ số của tôi", chart: "Văn bản của tôi theo tháng", pending: "Việc đang chờ tôi", week: "Lịch tuần lãnh đạo", today: "Lịch của tôi hôm nay", notifications: "Thông báo" }
const zoneHint: Record<DashboardZone, string> = { top: "Đầu trang — thả widget vào đây để rộng toàn màn hình, trên cả hai cột", main: "Cột chính — thả widget vào đây", side: "Cột bên — thả widget vào đây" }

export interface DashboardPageProps {
  dateLabel: string
  stats: StatCardProps[]
  chart: { title: string; subtitle?: string } & Pick<LineChartProps, "labels" | "series">
  pending: { subtitle?: string } & DashboardPendingInfo
  week: { title: string; rangeLabel: string; days: DashboardWeekDay[]; leaders?: DashboardWeekLeader[]; emptyText?: string }
  today: { dateLabel: string; events: DashboardScheduleEvent[] }
  notifications: DashboardNotification[]
  layouts?: DashboardLayoutPreset[]
  defaultLayoutId?: string
  defaultEditMode?: boolean
  onLayoutChange?: (id: string) => void
  onCustomize?: (editing: boolean) => void
  /** "Lưu thành bố cục riêng…" in customize mode. */
  onSaveLayout?: (layout: DashboardLayoutState) => void
  onCreateLayout?: () => void
  onManageLayouts?: () => void
  onWeekPrev?: () => void
  onWeekNext?: () => void
  onViewAllNotifications?: () => void
  /** "Tải lại" item of a widget menu. */
  onReloadWidget?: (id: DashboardWidgetId) => void
}

interface State { zones: Record<DashboardZone, DashboardWidgetId[]>; hidden: Set<DashboardWidgetId>; half: Set<DashboardWidgetId> }
const initial = (preset: DashboardLayoutPreset): State => ({ zones: { top: [], main: ["stats", "chart", "pending", "week"], side: ["today", "notifications"] }, hidden: new Set(preset.hidden), half: new Set() })
const clone = (s: State): State => ({ zones: { top: [...s.zones.top], main: [...s.zones.main], side: [...s.zones.side] }, hidden: new Set(s.hidden), half: new Set(s.half) })

export function DashboardPage({ dateLabel, stats, chart, pending, week, today, notifications, layouts = dashboardDefaultLayouts, defaultLayoutId, defaultEditMode = false, onLayoutChange, onCustomize, onSaveLayout, onCreateLayout, onManageLayouts, onWeekPrev, onWeekNext, onViewAllNotifications, onReloadWidget }: DashboardPageProps) {
  const [layoutId, setLayoutId] = React.useState(defaultLayoutId ?? layouts[0]!.id)
  const layout = layouts.find((l) => l.id === layoutId) ?? layouts[0]!
  const [state, setState] = React.useState(() => initial(layout))
  const [editing, setEditing] = React.useState(defaultEditMode)
  const snapshot = React.useRef<State | null>(null)
  const [dragId, setDragId] = React.useState<DashboardWidgetId | null>(null)
  const [lifted, setLifted] = React.useState<DashboardWidgetId | null>(null)
  const [announce, setAnnounce] = React.useState("")

  const pickLayout = (id: string) => {
    const next = layouts.find((l) => l.id === id)
    if (!next) return
    setLayoutId(id); setState(initial(next)); onLayoutChange?.(id)
  }
  const zoneOf = (s: State, id: DashboardWidgetId): DashboardZone => (s.zones.top.includes(id) ? "top" : s.zones.side.includes(id) ? "side" : "main")
  const visible = (zone: DashboardZone, s = state) => s.zones[zone].filter((w) => !s.hidden.has(w))
  const hide = (id: DashboardWidgetId) => setState((s) => ({ ...s, hidden: new Set(s.hidden).add(id) }))
  const show = (id: DashboardWidgetId) => setState((s) => { const h = new Set(s.hidden); h.delete(id); return { ...s, hidden: h } })
  const move = (id: DashboardWidgetId, dir: -1 | 1) => setState((s) => {
    const zone = zoneOf(s, id)
    const col = visible(zone, s)
    const target = col[col.indexOf(id) + dir]
    if (!target) return s
    const list = [...s.zones[zone]]
    const a = list.indexOf(id), b = list.indexOf(target)
    ;[list[a], list[b]] = [list[b]!, list[a]!]
    return { ...s, zones: { ...s.zones, [zone]: list } }
  })
  const moveTo = (id: DashboardWidgetId, zone: DashboardZone, before?: DashboardWidgetId) => setState((s) => {
    if (id === before) return s
    const zones = { top: s.zones.top.filter((w) => w !== id), main: s.zones.main.filter((w) => w !== id), side: s.zones.side.filter((w) => w !== id) }
    const at = before ? zones[zone].indexOf(before) : -1
    zones[zone].splice(at < 0 ? zones[zone].length : at, 0, id)
    return { ...s, zones }
  })
  const toggleHalf = (id: DashboardWidgetId) => setState((s) => { const h = new Set(s.half); if (h.has(id)) h.delete(id); else h.add(id); return { ...s, half: h } })

  const startEdit = () => { snapshot.current = clone(state); setEditing(true); onCustomize?.(true) }
  const stopEdit = (save: boolean) => {
    if (!save && snapshot.current) setState(snapshot.current)
    else if (save) onSaveLayout?.({ zones: state.zones, hidden: [...state.hidden], half: [...state.half] })
    snapshot.current = null; setLifted(null); setDragId(null); setEditing(false); onCustomize?.(false)
  }

  const menuFor = (id: DashboardWidgetId): DashboardWidgetMenuItem[] => {
    if (!editing) return defaultWidgetMenu
    const zone = zoneOf(state, id), col = visible(zone), i = col.indexOf(id)
    return [
      { id: "up", label: "Di chuyển lên", disabled: i <= 0 },
      { id: "down", label: "Di chuyển xuống", disabled: i >= col.length - 1 },
      { id: "hide", label: "Ẩn widget này", icon: <EyeOff />, destructive: true, separatorBefore: true },
    ]
  }
  const onMenu = (id: DashboardWidgetId) => (action: string) => {
    if (action === "hide") hide(id)
    else if (action === "up" || action === "down") move(id, action === "up" ? -1 : 1)
    else if (action === "reload") onReloadWidget?.(id)
  }

  const handleKey = (id: DashboardWidgetId) => (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault()
      setLifted((l) => { const v = l === id ? null : id; setAnnounce(v ? `${widgetTitles[id]}: đã nhấc, dùng phím mũi tên để di chuyển` : `${widgetTitles[id]}: đã thả`); return v })
    } else if (lifted === id) {
      if (e.key === "Escape") { setLifted(null); return }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); move(id, e.key === "ArrowUp" ? -1 : 1) }
      if (e.key === "ArrowLeft" && zoneOf(state, id) === "side") { e.preventDefault(); moveTo(id, "main") }
      if (e.key === "ArrowRight" && zoneOf(state, id) === "main") { e.preventDefault(); moveTo(id, "side") }
    }
  }

  const editBar = (id: DashboardWidgetId, zone: DashboardZone, bare: boolean) => (
    <div className={cn("flex min-h-[38px] items-center gap-2 p-1 pr-1.5 text-small", bare ? "mb-2 rounded-[10px] border border-dashed border-(--bd-ke-2) bg-(--bd-mat)" : "rounded-t-[14px] border-b border-dashed border-(--bd-ke-2) bg-(--bd-mat-2)")}>
      <button
        type="button" draggable aria-pressed={lifted === id} aria-label={`${widgetTitles[id]}. Kéo để di chuyển, hoặc Space để nhấc bằng bàn phím`} title="Kéo để di chuyển · Space để nhấc bằng bàn phím"
        onDragStart={(e) => { setDragId(id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", id) }} onDragEnd={() => setDragId(null)} onKeyDown={handleKey(id)} onBlur={() => lifted === id && setLifted(null)}
        className={cn("grid size-[30px] shrink-0 cursor-grab place-items-center rounded-[7px] border-0 bg-transparent p-0 text-title leading-none text-(--bd-chu-3) outline-none hover:bg-muted hover:text-(--bd-chu) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--bd-s1) active:cursor-grabbing", lifted === id && "bg-accent text-primary")}
      >⠿</button>
      <span className="min-w-0 truncate font-semibold text-(--bd-chu)">{widgetTitles[id]}</span>
      {zone === "main" && (
        <button type="button" onClick={() => toggleHalf(id)} title={state.half.has(id) ? "Mở rộng đầy bề ngang" : "Thu còn nửa bề ngang — đứng cạnh ô nửa liền trước/sau"} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-(--bd-ke-2) bg-white px-2 py-px text-label leading-5 font-semibold whitespace-nowrap text-(--bd-chu-2) hover:border-(--bd-s1) hover:text-(--bd-s1) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--bd-s1) dark:bg-card">
          {state.half.has(id) ? <Maximize2 className="size-[13px]" /> : <Minimize2 className="size-[13px]" />}{state.half.has(id) ? "Nửa bề ngang" : "Rộng đầy"}
        </button>
      )}
      <span className="flex-1" />
      <WidgetMenu id={id} items={menuFor(id)} onSelect={onMenu(id)} />
    </div>
  )

  const ghi = (zone: DashboardZone, id: DashboardWidgetId) => ({
    className: editing ? "outline-[1.5px] outline-offset-[3px] outline-dashed outline-(--bd-ke-2) hover:outline-(--bd-s1)" + (id === "stats" ? " border-transparent bg-transparent shadow-none" : "") : undefined,
    editBar: editing ? editBar(id, zone, id === "stats") : undefined,
    menuItems: menuFor(id),
    onMenuSelect: onMenu(id),
    bare: id === "stats",
    menuLabel: `Thao tác với ${widgetTitles[id]}`,
  })

  const widgetNode = (id: DashboardWidgetId, zone: DashboardZone): React.ReactNode => {
    const c = ghi(zone, id)
    switch (id) {
      case "stats":
        return (
          <DashboardWidget key={id} {...c}>
            <div className="grid grid-cols-4 gap-3.5 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">{stats.map((s) => <StatCard key={s.label} {...s} />)}</div>
          </DashboardWidget>
        )
      case "chart":
        return <DashboardWidget key={id} {...c} title={chart.title} subtitle={chart.subtitle}><LineChart labels={chart.labels} series={chart.series} ariaLabel={chart.title} /></DashboardWidget>
      case "pending":
        return (
          <DashboardWidget key={id} {...c} title="Việc đang chờ tôi" subtitle={pending.subtitle}>
            <p className="m-0 mt-[18px] mb-1 rounded-[11px] border border-dashed border-(--bd-ke-2) px-[15px] py-[11px] text-small leading-[1.7] text-(--bd-chu-3)"><b className="mr-1.5 font-semibold text-(--bd-chu-2)">{pending.emptyTitle}</b><span>{pending.emptyHint}</span></p>
          </DashboardWidget>
        )
      case "week":
        return (
          <DashboardWidget
            key={id} {...c} title={week.title} headerClassName="gap-x-3" bodyClassName="p-0"
            actions={
              <>
                <button type="button" aria-label="Tuần trước" onClick={onWeekPrev} className="size-6 cursor-pointer rounded-[7px] border border-(--bd-ke-2) bg-(--bd-mat) p-0 text-sm leading-none text-(--bd-chu-2) hover:border-(--bd-s1) hover:text-(--bd-s1) disabled:opacity-45">‹</button>
                <b className="font-mono text-xs font-semibold text-(--bd-chu-2)">{week.rangeLabel}</b>
                <button type="button" aria-label="Tuần sau" onClick={onWeekNext} className="size-6 cursor-pointer rounded-[7px] border border-(--bd-ke-2) bg-(--bd-mat) p-0 text-sm leading-none text-(--bd-chu-2) hover:border-(--bd-s1) hover:text-(--bd-s1) disabled:opacity-45">›</button>
              </>
            }
          >
            <WeekScheduleGrid title={week.title} days={week.days} leaders={week.leaders} emptyText={week.emptyText} className="mt-3" />
          </DashboardWidget>
        )
      case "today":
        return (
          <DashboardWidget key={id} {...c} title="Lịch của tôi hôm nay" actions={<span className="font-mono text-label text-(--bd-chu-3)">{today.dateLabel}</span>} bodyClassName="pt-[11px] pb-4">
            {today.events.length === 0
              ? <p className="m-0 rounded-[10px] border border-dashed border-(--bd-ke-2) p-3.5 text-center text-body leading-[1.7] text-(--bd-chu-3)">Không có lịch công tác</p>
              : <ul className="m-0 flex list-none flex-col gap-1.5 p-0 text-body">{today.events.map((e) => <li key={e.id} className="rounded-md border-l-[3px] border-(--bd-s1) bg-accent px-2.5 py-1.5 text-accent-foreground"><b className="font-mono font-semibold">{e.time}</b> {e.title}</li>)}</ul>}
          </DashboardWidget>
        )
      case "notifications":
        return (
          <DashboardWidget key={id} {...c} title="Thông báo" actions={<button type="button" onClick={onViewAllNotifications} className="cursor-pointer border-0 bg-transparent p-0 text-small font-semibold text-(--bd-s1)">Tất cả →</button>} bodyClassName="px-2.5 pt-[7px] pb-2.5">
            {notifications.length === 0 ? <p className="m-0 p-2 text-center text-body text-(--bd-chu-3)">Không có thông báo mới</p> : (
              <ul className="m-0 flex list-none flex-col p-0">
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button type="button" className="flex w-full cursor-pointer items-start gap-2.5 rounded-lg border-0 bg-transparent px-2 py-[9px] text-left font-[inherit] text-inherit outline-none transition-colors duration-[120ms] hover:bg-(--bd-ke) focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-(--bd-s1)">
                      <i aria-hidden className={cn("mt-1.5 size-[7px] shrink-0 rounded-full", n.unread ? "bg-(--bd-s1)" : "bg-transparent shadow-[inset_0_0_0_1.5px_var(--bd-ke-2)]")} />
                      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                        <span className="line-clamp-2 text-body leading-[1.4] break-words text-(--bd-chu-2)">{n.title}</span>
                        <span className="flex items-center justify-between gap-2 text-label text-(--bd-chu-3)"><span className="min-w-0 truncate">{n.sender}</span><time className="shrink-0 tabular-nums">{n.time}</time></span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </DashboardWidget>
        )
    }
  }

  /** Grid item wrapper: drop target in customize mode. */
  const cell = (id: DashboardWidgetId, zone: DashboardZone) => (
    <div
      key={id}
      className={cn("min-w-0", zone === "main" && !state.half.has(id) && "col-span-full")}
      onDragOver={editing && dragId ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move" } : undefined}
      onDrop={editing && dragId ? (e) => { e.preventDefault(); e.stopPropagation(); moveTo(dragId, zone, id); setDragId(null) } : undefined}
    >
      {widgetNode(id, zone)}
    </div>
  )
  const zoneBox = (zone: DashboardZone, className?: string) => {
    const ids = visible(zone)
    if (!editing && ids.length === 0) return null
    return (
      <div
        data-zone={zone}
        className={cn("min-w-0", editing && "-m-2 rounded-2xl p-2 transition-colors duration-[120ms]", editing && ids.length === 0 && zone !== "top" && "min-h-[120px]", dragId && "bg-(--bd-s1)/5", className)}
        onDragOver={editing && dragId ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move" } : undefined}
        onDrop={editing && dragId ? (e) => { e.preventDefault(); moveTo(dragId, zone); setDragId(null) } : undefined}
      >
        <div className={cn("grid items-start gap-4", zone === "main" ? "grid-cols-2 max-[1160px]:grid-cols-1" : "grid-cols-1")}>{ids.map((id) => cell(id, zone))}</div>
        {editing && ids.length === 0 && (
          <p className={cn("m-0 rounded-xl border-[1.5px] border-dashed p-[26px_12px] text-center text-small", zone === "top" ? "border-[#bee3df] bg-[#f5fbfa] p-3 text-[#10705c] dark:border-[#1f5a52] dark:bg-[#10231f] dark:text-[#6fd0c0]" : "border-(--bd-ke-2) text-(--bd-chu-3)")}>{zoneHint[zone]}</p>
        )}
      </div>
    )
  }

  const hiddenIds = [...state.hidden]
  const hasSide = editing || visible("side").length > 0
  return (
    <div data-editing={editing ? "true" : undefined} className={cn(bdTokens, "text-foreground")}>
      {editing ? (
        <div role="toolbar" aria-label="Tùy chỉnh trang chủ" className="sticky top-0 z-20 mb-[18px] flex flex-wrap items-center gap-2 rounded-xl border border-border bg-[#f1f6fd] px-3 py-2.5 shadow-[0_6px_18px_#0b2e4a14] dark:border-[#2f4a63] dark:bg-[#17283a]">
          <div className="flex min-w-[220px] flex-1 flex-col text-small text-(--bd-chu-2)"><b className="text-control text-(--bd-chu)">Đang sửa: {layout.name}</b><span>Thay đổi sẽ lưu thành một bố cục riêng — mẫu không bị đụng.</span></div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><Plus />Thêm widget</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hiddenIds.length === 0 ? <DropdownMenuItem disabled>Không có widget bị ẩn</DropdownMenuItem> : hiddenIds.map((id) => <DropdownMenuItem key={id} onSelect={() => show(id)}><Plus />{widgetTitles[id]}</DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" onClick={() => stopEdit(false)}>Hủy</Button>
          <Button onClick={() => stopEdit(true)}>Lưu thành bố cục riêng…</Button>
        </div>
      ) : (
        <div className="mb-3.5 flex flex-wrap items-center gap-2">
          <span className="text-body font-semibold text-(--bd-chu-2)">{dateLabel}</span>
          <span className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Chọn bố cục" className="font-normal [&_svg]:size-3.5"><span>Bố cục:</span> <b className="font-bold text-foreground">{layout.name}</b><ChevronDown className="ml-0.5 text-subtle-foreground" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[260px]">
              {layouts.map((l) => (
                <DropdownMenuItem key={l.id} onSelect={() => pickLayout(l.id)} className={cn("min-h-[30px] text-body", l.id === layout.id && "bg-accent font-semibold text-primary")}>
                  <span className="min-w-0 flex-1 leading-[1.3]">{l.name}{l.note ? <em className="block text-label font-normal text-subtle-foreground not-italic">{l.note}</em> : null}</span>
                  {l.id === layout.id && <Check className="text-current" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onCreateLayout?.()}><Plus />Tạo bố cục mới</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onManageLayouts?.()}><LayoutGrid />Quản lý bố cục…</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" title="Tùy chỉnh trang chủ: kéo thả, ẩn/hiện, thêm widget" onClick={startEdit}><Settings />Tùy chỉnh</Button>
        </div>
      )}
      <div className={cn("flex flex-col", editing ? "gap-7" : "gap-4")}>
        {(editing || visible("top").length > 0) && zoneBox("top")}
        <div className={cn("grid items-start", editing ? "gap-7" : "gap-4", hasSide ? "grid-cols-[minmax(0,1fr)_300px] max-[1160px]:grid-cols-1" : "grid-cols-1")}>
          {zoneBox("main")}
          {hasSide && zoneBox("side")}
        </div>
        <div role="status" aria-live="assertive" className="absolute size-px overflow-hidden whitespace-nowrap [clip:rect(0,0,0,0)]">{announce}</div>
      </div>
    </div>
  )
}

function WidgetMenu({ id, items, onSelect }: { id: DashboardWidgetId; items: DashboardWidgetMenuItem[]; onSelect: (id: string) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={`Thao tác với ${widgetTitles[id]}`} title={`Thao tác với ${widgetTitles[id]}`} className="grid size-[30px] cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-title leading-none text-subtle-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary">⋯</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {items.map((m) => (
          <React.Fragment key={m.id}>
            {m.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem disabled={m.disabled} variant={m.destructive ? "destructive" : "default"} onSelect={() => onSelect(m.id)}>{m.icon}{m.label}</DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
