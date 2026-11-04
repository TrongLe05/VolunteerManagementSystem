"use client"

// @dthu/ui 0.2.0 · block-admin
import { FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { EmptyState } from "@/components/ui/empty-state"
import { cn } from "@/lib/utils"
import { AdminFilterBar, AdminGrid, AdminPage, AdminPanel, AdminSegmented, AdminStat, adminCell } from "./parts"

export type StatsRange = "7" | "30" | "90" | "year"
export type StatsDimension = "type" | "topic" | "priority" | "assignee" | "unit" | "page" | "build"
export interface SupportStats { created: number; resolved: number; backlog: number; firstResponse?: string; firstResponseP90?: string; resolveTime?: string; resolveTimeP90?: string; onTime?: string; satisfaction?: string; ratings: number; reopened?: string }
export interface SupportStatsWeek { label: string; created: number; resolved: number }
export interface SupportStatsRow { key: string; name: string; count: number; resolved: number; firstResponse?: string; resolveTime?: string; onTime?: string; satisfaction?: string; reopened?: string }

const dimensions: { value: StatsDimension; label: string }[] = [
  { value: "type", label: "Loại" }, { value: "topic", label: "Chủ đề" }, { value: "priority", label: "Mức" }, { value: "assignee", label: "Người phụ trách" },
  { value: "unit", label: "Đơn vị" }, { value: "page", label: "Trang" }, { value: "build", label: "Bản build" },
]

export interface SupportStatsPageProps {
  stats: SupportStats
  weeks: SupportStatsWeek[]
  rows: SupportStatsRow[]
  range: StatsRange
  onRangeChange?: (r: StatsRange) => void
  from?: Date
  to?: Date
  onFromChange?: (v: Date | undefined) => void
  onToChange?: (v: Date | undefined) => void
  dimension: StatsDimension
  onDimensionChange?: (d: StatsDimension) => void
  onRefresh?: () => void
  onExport?: () => void
}

const dash = (v?: string) => v ?? "—"

/** Support statistics: KPIs, weekly chart and breakdown table. */
export function SupportStatsPage({ stats, weeks, rows, range, onRangeChange, from, to, onFromChange, onToChange, dimension, onDimensionChange, onRefresh, onExport }: SupportStatsPageProps) {
  const max = Math.max(1, ...weeks.flatMap((w) => [w.created, w.resolved]))
  const dimLabel = dimensions.find((d) => d.value === dimension)?.label ?? ""
  return (
    <AdminPage className="gap-3 overflow-auto pb-4">
      <AdminFilterBar hideSearch className="mb-1.5" onRefresh={onRefresh}
        filters={
          <>
            <AdminSegmented variant="solid" label="Khoảng thời gian" value={range} onChange={onRangeChange} options={[{ value: "7", label: "7 ngày" }, { value: "30", label: "30 ngày" }, { value: "90", label: "90 ngày" }, { value: "year", label: "Năm nay" }]} />
            <div className="inline-flex items-center gap-1.5 text-body text-muted-foreground">Từ<DatePicker aria-label="Từ ngày" value={from} onChange={onFromChange} className="h-9 w-[150px]" /></div>
            <div className="inline-flex items-center gap-1.5 text-body text-muted-foreground">đến<DatePicker aria-label="Đến ngày" value={to} onChange={onToChange} className="h-9 w-[150px]" /></div>
          </>
        }
        actions={<Button variant="outline" size="sm" className="text-small [&_svg]:size-3.5" onClick={onExport}><FileSpreadsheet />Xuất Excel</Button>} />
      <div className="grid flex-none grid-cols-2 gap-2 xl:grid-cols-4">
        <AdminStat label="Phiếu mới" value={stats.created} />
        <AdminStat label="Đã giải quyết" value={stats.resolved} accent />
        <AdminStat label="Còn tồn" value={stats.backlog} hint="phiếu hiện đang mở" />
        <AdminStat label="Phản hồi đầu" value={dash(stats.firstResponse)} hint={`P90 ${dash(stats.firstResponseP90)}`} />
        <AdminStat label="Giải quyết" value={dash(stats.resolveTime)} hint={`P90 ${dash(stats.resolveTimeP90)}`} />
        <AdminStat label="Đúng hạn" value={dash(stats.onTime)} />
        <AdminStat label="Hài lòng" value={<>{dash(stats.satisfaction)}<small>/5</small></>} hint={`${stats.ratings} đánh giá`} />
        <AdminStat label="Mở lại" value={dash(stats.reopened)} hint="trên số đã giải quyết" />
      </div>
      <AdminPanel title="Theo tuần" description="Phiếu mới và phiếu đã giải quyết trong khoảng đã chọn." className="flex-none">
        {weeks.length === 0 ? <div className="rounded-lg border bg-card"><EmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ hiện ở đây khi có." className="py-[38px] [&>div:nth-of-type(1)]:font-bold" /></div> : (
          <div className="flex h-44 items-end gap-3 rounded-lg border p-3" role="img" aria-label="Biểu đồ phiếu mới và đã giải quyết theo tuần">
            {weeks.map((w) => (
              <div key={w.label} className="flex h-full flex-1 flex-col justify-end gap-1">
                <div className="flex flex-1 items-end justify-center gap-1"><div className="w-3 rounded-t bg-primary" style={{ height: `${(w.created / max) * 100}%` }} title={`Mới: ${w.created}`} /><div className="w-3 rounded-t bg-success" style={{ height: `${(w.resolved / max) * 100}%` }} title={`Đã giải quyết: ${w.resolved}`} /></div>
                <div className="text-center text-caption text-muted-foreground">{w.label}</div>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>
      <AdminPanel title="Chi tiết" description="Thời gian tính bằng giờ làm việc. Đúng hạn dưới 80% tô đỏ." className="flex-none" action={<AdminSegmented variant="solid" label="Nhóm theo" value={dimension} onChange={onDimensionChange} options={dimensions} />}>
        <AdminGrid label="Chi tiết thống kê" minWidth={1034} cols={[undefined, 96, 118, 150, 150, 100, 110, 90]} head={[dimLabel, ...["Số phiếu", "Đã giải quyết", "Phản hồi đầu", "Giải quyết", "Đúng hạn", "Hài lòng", "Mở lại"].map((h) => <span key={h} className="block text-right">{h}</span>)]}
          footer={rows.length === 0 ? <EmptyState title="Chưa có dữ liệu" description="Dữ liệu sẽ hiện ở đây khi có." className="py-[38px] [&>div:nth-of-type(1)]:font-bold" /> : undefined}>
          {rows.map((r) => (
            <tr key={r.key} className="group/row"><td className={cn(adminCell, "text-sm font-[550]")}>{r.name}</td><td className={cn(adminCell, "text-right tabular-nums")}>{r.count}</td><td className={cn(adminCell, "text-right tabular-nums")}>{r.resolved}</td><td className={cn(adminCell, "text-right")}>{dash(r.firstResponse)}</td><td className={cn(adminCell, "text-right")}>{dash(r.resolveTime)}</td><td className={cn(adminCell, "text-right", r.onTime && parseInt(r.onTime) < 80 && "font-semibold text-destructive")}>{dash(r.onTime)}</td><td className={cn(adminCell, "text-right")}>{dash(r.satisfaction)}</td><td className={cn(adminCell, "text-right")}>{dash(r.reopened)}</td></tr>
          ))}
        </AdminGrid>
      </AdminPanel>
    </AdminPage>
  )
}
