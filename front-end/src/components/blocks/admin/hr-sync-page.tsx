"use client"

// @dthu/ui 0.2.0 · block-admin
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { AdminFilterSelect, AdminPage, AdminFilterBar } from "./parts"

export interface HrSyncRun { id: string; startedAt: string; runBy: string; mode: "full" | "incremental" | "dry"; total: number; created: number; updated: number; status: "success" | "running" | "failed" }

const modeLabel = { full: "Toàn bộ", incremental: "Gia tăng", dry: "Chạy thử" }
const statusBadge = { success: <Badge variant="success">Thành công</Badge>, running: <Badge variant="info">Đang chạy</Badge>, failed: <Badge variant="destructive">Lỗi</Badge> }

export interface HrSyncPageProps {
  runs: HrSyncRun[]
  statusFilter?: string
  onStatusFilterChange?: (v: string) => void
  onRefresh?: () => void
  onMapDepartments?: () => void
  onDryRun?: () => void
  onRun?: () => void
  running?: boolean
}

/** History of HR sync runs with run actions. */
export function HrSyncPage({ runs, statusFilter = "all", onStatusFilterChange, onRefresh, onMapDepartments, onDryRun, onRun, running }: HrSyncPageProps) {
  const columns: Column<HrSyncRun>[] = [
    { key: "stt", header: "STT", width: 45, align: "center", className: "tabular-nums text-muted-foreground", cell: (_r, i) => i + 1 },
    { key: "at", header: "Thời điểm chạy", width: 170, cell: (r) => r.startedAt },
    { key: "by", header: "Người chạy", width: 170, cell: (r) => r.runBy },
    { key: "mode", header: "Chế độ", width: 110, cell: (r) => modeLabel[r.mode] },
    { key: "total", header: "Tổng", width: 90, align: "right", className: "tabular-nums", cell: (r) => r.total },
    { key: "new", header: "Mới", width: 90, align: "right", className: "tabular-nums", cell: (r) => r.created },
    { key: "upd", header: "Cập nhật", width: 100, align: "right", className: "tabular-nums", cell: (r) => r.updated },
    { key: "status", header: "Trạng thái", cell: (r) => statusBadge[r.status] },
    { key: "__actions", header: <span className="sr-only">Thao tác</span>, width: 51, cell: () => null },
  ]
  return (
    <AdminPage>
      <AdminFilterBar hideSearch onRefresh={onRefresh}
        filters={<AdminFilterSelect caret label="Trạng thái" value={statusFilter} onChange={onStatusFilterChange} options={[{ value: "success", label: "Thành công" }, { value: "running", label: "Đang chạy" }, { value: "failed", label: "Lỗi" }]} />}
        actions={<>
          <Button variant="outline" size="toolbar" onClick={onMapDepartments}>Ánh xạ phòng ban</Button>
          <Button variant="outline" size="toolbar" onClick={onDryRun}>Không đồng bộ</Button>
          <Button size="toolbar" onClick={onRun} disabled={running}>+ Chạy đợt mới</Button>
        </>} />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[976px]" rows={runs} getRowId={(r) => r.id} pageSize={25} emptyTitle="Chưa có đợt đồng bộ" />
    </AdminPage>
  )
}
