"use client"

// @dthu/ui 0.2.0 · block-admin
import { Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FilterToggle } from "@/components/blocks/shell/page-chrome"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { AdminPage, AdminSegmented, AdminFilterBar } from "./parts"

export interface DelegationRow {
  id: string
  code: string
  person: string
  unit: string
  form: string
  scope: string
  from: string
  to: string
  status: "active" | "expired" | "revoked"
  reason?: string
}

export type DelegationDirection = "given" | "received"

export interface DelegationPageProps {
  rows: DelegationRow[]
  direction: DelegationDirection
  onDirectionChange?: (d: DelegationDirection) => void
  activeOnly?: boolean
  onActiveOnlyChange?: (v: boolean) => void
  search?: string
  onSearchChange?: (v: string) => void
  onRefresh?: () => void
  onOpenAssistants?: () => void
  onShowInfo?: () => void
  page?: number
  pageSize?: number
  onPageChange?: (p: number) => void
  onPageSizeChange?: (s: number) => void
}

const statusBadge = { active: <Badge variant="success">Còn hiệu lực</Badge>, expired: <Badge variant="secondary">Hết hạn</Badge>, revoked: <Badge variant="destructive">Đã thu hồi</Badge> }

/** Delegation (ủy quyền) list with given/received switch. */
export function DelegationPage({ rows, direction, onDirectionChange, activeOnly, onActiveOnlyChange, search, onSearchChange, onRefresh, onOpenAssistants, onShowInfo, page, pageSize = 25, onPageChange, onPageSizeChange }: DelegationPageProps) {
  const personHeader = direction === "given" ? "Người nhận" : "Người giao"
  const columns: Column<DelegationRow>[] = [
    { key: "code", header: "Mã", width: 118, cell: (r) => <span className="font-mono text-xs">{r.code}</span> },
    { key: "person", header: personHeader, cell: (r) => <span className="font-semibold">{r.person}</span> },
    { key: "unit", header: "Đơn vị", cell: (r) => r.unit },
    { key: "form", header: "Hình thức", width: 96, align: "center", cell: (r) => r.form },
    { key: "scope", header: "Phạm vi", cell: (r) => r.scope },
    { key: "range", header: "Từ – đến", width: 220, cell: (r) => <span className="whitespace-nowrap">{r.from} – {r.to}</span> },
    { key: "status", header: "Trạng thái", width: 160, cell: (r) => statusBadge[r.status] },
    { key: "reason", header: "Lý do", cell: (r) => r.reason ?? <span className="text-muted-foreground">—</span> },
    { key: "__actions", header: <span className="sr-only">Thao tác</span>, width: 51, cell: () => null },
  ]
  return (
    <AdminPage>
      <AdminFilterBar
        search={search} onSearchChange={onSearchChange} searchPlaceholder="Tìm mã, người nhận, đơn vị, lý do…" onRefresh={onRefresh}
        filters={
          <>
            <FilterToggle pressed={!!activeOnly} className="order-first" onClick={() => onActiveOnlyChange?.(!activeOnly)}>Còn hiệu lực</FilterToggle>
            <AdminSegmented label="Chiều ủy quyền" value={direction} onChange={onDirectionChange} options={[{ value: "given", label: "Đã giao" }, { value: "received", label: "Được nhận" }]} className="order-first" />
          </>
        }
        hideKbd beforeRefresh={<Button variant="outline" size="toolbar-icon" aria-label="Thông tin" title="Thông tin" className="cursor-help text-muted-foreground hover:text-foreground" onClick={onShowInfo}><Info /></Button>}
        actions={<Button variant="outline" size="toolbar" onClick={onOpenAssistants}>Người hỗ trợ</Button>}
      />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[1365px]" rows={rows} getRowId={(r) => r.id} page={page} pageSize={pageSize} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} emptyTitle="Chưa có ủy quyền" />
    </AdminPage>
  )
}
