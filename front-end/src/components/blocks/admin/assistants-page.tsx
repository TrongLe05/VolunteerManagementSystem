"use client"

// @dthu/ui 0.2.0 · block-admin
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FilterToggle } from "@/components/blocks/shell/page-chrome"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { AdminPage, AdminSegmented, AdminFilterBar } from "./parts"

export interface AssistantRow { id: string; name: string; unit: string; permissions: string[]; docTypes: string; deadline: string; status: "active" | "expired" | "pending" }
export type AssistantView = "mine" | "assigned" | "directed"

export interface AssistantsPageProps {
  rows: AssistantRow[]
  view: AssistantView
  onViewChange?: (v: AssistantView) => void
  activeOnly?: boolean
  onActiveOnlyChange?: (v: boolean) => void
  search?: string
  onSearchChange?: (v: string) => void
  onRefresh?: () => void
  onDelegate?: () => void
  page?: number
  pageSize?: number
  onPageChange?: (p: number) => void
  onPageSizeChange?: (s: number) => void
}

const status = { active: <Badge variant="success">Còn hiệu lực</Badge>, expired: <Badge variant="secondary">Hết hạn</Badge>, pending: <Badge variant="warning">Chờ duyệt</Badge> }

/** "Người hỗ trợ" (assistants) list of the delegation area. */
export function AssistantsPage({ rows, view, onViewChange, activeOnly, onActiveOnlyChange, search, onSearchChange, onRefresh, onDelegate, page, pageSize = 25, onPageChange, onPageSizeChange }: AssistantsPageProps) {
  const columns: Column<AssistantRow>[] = [
    { key: "name", header: "Người hỗ trợ", cell: (r) => <><span className="block truncate text-sm leading-[1.35] font-[550] tracking-[-0.005em]">{r.name}</span><span className="mt-0.5 block truncate text-label leading-[1.35] text-muted-foreground">{r.unit}</span></> },
    { key: "perm", header: "Quyền", cell: (r) => <div className="flex flex-wrap gap-1.5">{r.permissions.map((p) => <Badge key={p} variant="info">{p}</Badge>)}</div> },
    { key: "docs", header: "Loại văn bản", cell: (r) => r.docTypes },
    { key: "deadline", header: "Thời hạn", width: 150, cell: (r) => r.deadline },
    { key: "status", header: "Trạng thái", width: 140, cell: (r) => status[r.status] },
    { key: "__actions", header: <span className="sr-only">Thao tác</span>, width: 51, cell: () => null },
  ]
  return (
    <AdminPage>
      <AdminFilterBar
        search={search} onSearchChange={onSearchChange} searchPlaceholder="Tìm tên, đơn vị, loại văn bản…" onRefresh={onRefresh}
        filters={
          <>
            <FilterToggle pressed={!!activeOnly} className="order-first" onClick={() => onActiveOnlyChange?.(!activeOnly)}>Còn hiệu lực</FilterToggle>
            <AdminSegmented label="Chế độ xem" value={view} onChange={onViewChange} className="order-first" options={[{ value: "mine", label: "Người hỗ trợ của tôi" }, { value: "assigned", label: "Được giao cho tôi" }, { value: "directed", label: "Chỉ đạo" }]} />
          </>
        }
        hideKbd beforeRefresh={<Button variant="outline" size="toolbar-icon" aria-label="Thông tin" title="Thông tin" className="cursor-help text-muted-foreground hover:text-foreground"><Info /></Button>}
        actions={<Button variant="outline" size="toolbar" onClick={onDelegate}>Ủy quyền</Button>}
      />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[961px]" rows={rows} getRowId={(r) => r.id} page={page} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} emptyTitle="Chưa có người hỗ trợ" />
    </AdminPage>
  )
}
