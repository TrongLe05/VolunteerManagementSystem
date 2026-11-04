"use client"

// @dthu/ui 0.2.0 · block-admin
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { AdminFilterBar, AdminFilterSelect, AdminPage, AdminSegmented } from "./parts"

export type SupportStatus = "new" | "open" | "waiting" | "resolved"
export interface SupportRequest { id: string; code: string; title: string; topic: string; status: SupportStatus; assignee?: string; updatedAt: string }
export type SupportTab = "awaiting" | "open" | "done" | "all"

export const supportStatusLabel: Record<SupportStatus, string> = { new: "Mới", open: "Đang xử lý", waiting: "Chờ phản hồi", resolved: "Đã xong" }
const variant = { new: "info", open: "warning", waiting: "secondary", resolved: "success" } as const
export function SupportStatusBadge({ status }: { status: SupportStatus }) { return <Badge variant={variant[status]}>{supportStatusLabel[status]}</Badge> }

export interface SupportRequestsPageProps {
  requests: SupportRequest[]
  counts: Record<SupportTab, number>
  tab: SupportTab
  onTabChange?: (t: SupportTab) => void
  search?: string
  onSearchChange?: (v: string) => void
  typeFilter?: string
  typeOptions?: { value: string; label: string }[]
  onTypeFilterChange?: (v: string) => void
  onRefresh?: () => void
  onCreate?: () => void
  onOpen?: (r: SupportRequest) => void
}

/** "Yêu cầu của tôi": the user's own support tickets. */
export function SupportRequestsPage({ requests, counts, tab, onTabChange, search, onSearchChange, typeFilter = "all", typeOptions = [], onTypeFilterChange, onRefresh, onCreate, onOpen }: SupportRequestsPageProps) {
  const columns: Column<SupportRequest>[] = [
    { key: "stt", header: "STT", width: 45, align: "center", className: "tabular-nums text-muted-foreground", cell: (_r, i) => i + 1 },
    { key: "title", header: "Yêu cầu", cell: (r) => <><span className="block truncate text-sm leading-[1.35] font-[550] tracking-[-0.005em]">{r.title}</span><span className="mt-0.5 block truncate font-mono text-label leading-[1.35] text-muted-foreground">{r.code} · {r.topic}</span></> },
    { key: "status", header: "Trạng thái", width: 190, cell: (r) => <SupportStatusBadge status={r.status} /> },
    { key: "assignee", header: "Người phụ trách", width: 200, cell: (r) => r.assignee ?? <span className="text-subtle-foreground">Chưa phân công</span> },
    { key: "updated", header: "Cập nhật", width: 130, cell: (r) => r.updatedAt },
    { key: "act", header: "Thao tác", width: 110, align: "right", pin: false, cell: (r) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onOpen?.(r) }}>Mở</Button> },
    { key: "__actions", header: <span className="sr-only">Khác</span>, width: 51, cell: () => null },
  ]
  return (
    <AdminPage>
      <AdminFilterBar
        search={search} onSearchChange={onSearchChange} searchPlaceholder="Tìm theo mã (HT-…) hoặc nội dung…" onRefresh={onRefresh}
        filters={
          <>
            <AdminSegmented variant="toggles" label="Lọc theo trạng thái" value={tab} onChange={onTabChange} className="order-first" options={[{ value: "awaiting", label: "Chờ tôi trả lời", count: counts.awaiting }, { value: "open", label: "Đang mở", count: counts.open }, { value: "done", label: "Đã xong", count: counts.done }, { value: "all", label: "Tất cả", count: counts.all }]} />
            <AdminFilterSelect caret label="Loại" value={typeFilter} onChange={onTypeFilterChange} options={typeOptions} />
          </>
        }
        actions={<Button size="toolbar" onClick={onCreate}><Plus />Gửi yêu cầu</Button>}
      />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[1066px]" rows={requests} getRowId={(r) => r.id} pageSize={25} onRowClick={onOpen} emptyTitle="Chưa có yêu cầu" emptyDescription={<>Dữ liệu sẽ hiện ở đây khi có.<div className="mt-3"><Button onClick={onCreate}>Gửi yêu cầu</Button></div></>} />
    </AdminPage>
  )
}
