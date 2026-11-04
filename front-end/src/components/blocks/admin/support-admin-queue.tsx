"use client"

// @dthu/ui 0.2.0 · block-admin
import * as React from "react"
import { CircleCheck, UserPlus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterToggle } from "@/components/blocks/shell/page-chrome"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { AdminFilterBar, AdminFilterSelect, AdminPage, AdminStat } from "./parts"
import { SupportStatusBadge, supportStatusLabel, type SupportStatus } from "./support-requests-page"

export type SupportPriority = "low" | "normal" | "high" | "urgent"
export type SupportTicketKind = "bug" | "help" | "feedback"
export const supportKindLabel: Record<SupportTicketKind, string> = { bug: "Báo lỗi", help: "Nhờ hỗ trợ", feedback: "Góp ý" }
export type SupportBulkAction = "claim" | "assign" | "close"
export interface SupportTicket { id: string; kind?: SupportTicketKind; code: string; title: string; sender: string; topic: string; priority: SupportPriority; status: SupportStatus; assignee?: string; due?: string; overdue?: boolean }
export type SupportQueueKey = "unassigned" | "mine" | "overdue" | "soon" | "replied" | "all"

const priorityLabel: Record<SupportPriority, string> = { low: "Thấp", normal: "Bình thường", high: "Cao", urgent: "Khẩn" }

export interface SupportAdminQueueProps {
  tickets: SupportTicket[]
  counts: Record<SupportQueueKey, number>
  queue: SupportQueueKey
  onQueueChange?: (q: SupportQueueKey) => void
  search?: string
  onSearchChange?: (v: string) => void
  selectedIds?: string[]
  onSelectedIdsChange?: (ids: string[]) => void
  showDone?: boolean
  onShowDoneChange?: (v: boolean) => void
  onRefresh?: () => void
  onCreateProxy?: () => void
  onOpen?: (t: SupportTicket) => void
  /** Bulk actions shown when rows are selected. */
  onBulkAction?: (action: SupportBulkAction, ids: string[]) => void
  /** Optional controlled filter values ("all" or an option value). Uncontrolled when omitted. */
  filters?: Partial<SupportQueueFilters>
  onFiltersChange?: (f: SupportQueueFilters) => void
  topicOptions?: { value: string; label: string }[]
}
export interface SupportQueueFilters { kind: string; topic: string; status: string; priority: string }

const tiles: { key: SupportQueueKey; label: string }[] = [
  { key: "unassigned", label: "Chưa ai nhận" }, { key: "mine", label: "Của tôi đang mở" }, { key: "overdue", label: "Quá hạn" },
  { key: "soon", label: "Sắp hạn" }, { key: "replied", label: "Người gửi vừa trả lời" }, { key: "all", label: "Tất cả của nhóm" },
]

/** Admin queue for support tickets: KPI tiles, filters, bulk-selectable table. */
export function SupportAdminQueue({ tickets: allTickets, counts, queue, onQueueChange, search, onSearchChange, selectedIds = [], onSelectedIdsChange, showDone, onShowDoneChange, onRefresh, onCreateProxy, onOpen, onBulkAction, filters, onFiltersChange, topicOptions }: SupportAdminQueueProps) {
  const [local, setLocal] = React.useState<SupportQueueFilters>({ kind: "all", topic: "all", status: "all", priority: "all" })
  const f: SupportQueueFilters = { ...local, ...filters }
  const setF = (patch: Partial<SupportQueueFilters>) => { const next = { ...f, ...patch }; setLocal(next); onFiltersChange?.(next) }
  const tickets = allTickets.filter((t) => (f.kind === "all" || t.kind === f.kind) && (f.topic === "all" || t.topic === f.topic) && (f.status === "all" || t.status === f.status) && (f.priority === "all" || t.priority === f.priority))
  const topics = topicOptions ?? [...new Set(allTickets.map((t) => t.topic))].map((x) => ({ value: x, label: x }))
  const allSelected = tickets.length > 0 && tickets.every((t) => selectedIds.includes(t.id))
  const toggle = (id: string, on: boolean) => onSelectedIdsChange?.(on ? [...selectedIds, id] : selectedIds.filter((x) => x !== id))
  const columns: Column<SupportTicket>[] = [
    { key: "sel", width: 44, align: "center", header: <Checkbox aria-label="Chọn tất cả" checked={allSelected} onCheckedChange={(c) => onSelectedIdsChange?.(c === true ? tickets.map((t) => t.id) : [])} />, cell: (t) => <Checkbox aria-label={`Chọn ${t.code}`} checked={selectedIds.includes(t.id)} onCheckedChange={(c) => toggle(t.id, c === true)} onClick={(e) => e.stopPropagation()} /> },
    { key: "code", width: 120, header: "Mã", cell: (t) => <span className="font-mono text-label font-medium whitespace-nowrap">{t.code}</span> },
    { key: "title", header: "Tiêu đề", cell: (t) => <span className="block truncate text-sm font-[550] tracking-[-0.005em]">{t.title}</span> },
    { key: "sender", width: 170, header: "Người gửi", cell: (t) => t.sender },
    { key: "topic", width: 140, header: "Chủ đề", cell: (t) => t.topic },
    { key: "pri", width: 80, header: "Mức", cell: (t) => <Badge variant={t.priority === "urgent" ? "destructive" : t.priority === "high" ? "warning" : "secondary"}>{priorityLabel[t.priority]}</Badge> },
    { key: "status", width: 130, header: "Trạng thái", cell: (t) => <SupportStatusBadge status={t.status} /> },
    { key: "assignee", width: 150, header: "Phụ trách", cell: (t) => t.assignee ?? <span className="text-muted-foreground">—</span> },
    { key: "due", width: 132, header: "Hạn", cell: (t) => (t.due ? <span className={t.overdue ? "font-semibold text-destructive" : undefined}>{t.due}</span> : <span className="text-muted-foreground">—</span>) },
    { key: "more", width: 84, header: <span className="sr-only">Khác</span>, cell: () => null },
    { key: "__actions", width: 51, header: <span className="sr-only">Thao tác</span>, cell: () => null },
  ]
  return (
    <AdminPage>
      <div className="mb-0.5 grid flex-none grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => <AdminStat key={t.key} label={t.label} value={counts[t.key]} active={queue === t.key} onClick={() => onQueueChange?.(t.key)} />)}
      </div>
      <AdminFilterBar hideKbd hideSearch={false} className="[&>div>div:first-child]:max-w-[320px]" search={search} onSearchChange={onSearchChange} searchPlaceholder="Mã, tiêu đề, người gửi…" onRefresh={onRefresh}
        filters={
          <>
            <AdminFilterSelect menu label="Loại" value={f.kind} onChange={(v) => setF({ kind: v })} options={(Object.keys(supportKindLabel) as SupportTicketKind[]).map((k) => ({ value: k, label: supportKindLabel[k] }))} />
            <AdminFilterSelect menu label="Chủ đề" value={f.topic} onChange={(v) => setF({ topic: v })} options={topics} />
            <AdminFilterSelect menu label="Trạng thái" value={f.status} onChange={(v) => setF({ status: v })} options={(Object.keys(supportStatusLabel) as SupportStatus[]).map((k) => ({ value: k, label: supportStatusLabel[k] }))} />
            <AdminFilterSelect menu label="Mức" value={f.priority} onChange={(v) => setF({ priority: v })} options={(Object.keys(priorityLabel) as SupportPriority[]).map((k) => ({ value: k, label: priorityLabel[k] }))} />
            <FilterToggle pressed={!!showDone} title="Phiếu đã đóng, từ chối hoặc đã phát hành" onClick={() => onShowDoneChange?.(!showDone)}><CircleCheck />Đã xong</FilterToggle>
          </>
        }
        actions={<Button variant="outline" size="toolbar" title="Tạo phiếu thay người dùng (gọi điện, nhắn Zalo)" onClick={onCreateProxy}><UserPlus />Tạo phiếu thay</Button>} />
      {selectedIds.length > 0 && (
        <div role="region" aria-label="Thao tác hàng loạt" className="flex shrink-0 flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-accent/50 px-3 py-2 text-sm">
          <span className="font-semibold">Đã chọn {selectedIds.length} phiếu</span>
          <Button size="sm" variant="outline" onClick={() => onBulkAction?.("claim", selectedIds)}>Nhận xử lý</Button>
          <Button size="sm" variant="outline" onClick={() => onBulkAction?.("assign", selectedIds)}>Gán cho…</Button>
          <Button size="sm" variant="outline" onClick={() => onBulkAction?.("close", selectedIds)}>Đóng phiếu</Button>
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => onSelectedIdsChange?.([])}><X />Bỏ chọn</Button>
        </div>
      )}
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[1341px]" rows={tickets} getRowId={(t) => t.id} pageSize={25} onRowClick={onOpen} emptyTitle="Chưa có phiếu" />
    </AdminPage>
  )
}
