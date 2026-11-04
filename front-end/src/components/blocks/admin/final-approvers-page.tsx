"use client"

// @dthu/ui 0.2.0 · block-admin
import { CircleHelp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { FilterToggle } from "@/components/blocks/shell/page-chrome"
import { AdminPage, AdminFilterBar } from "./parts"

export interface FinalApproverRow { id: string; unit: string; parentUnit: string; leadership?: boolean; approver?: string; candidates?: string; since?: string; assignedBy?: string; reason?: string; changeCount: number }

export interface FinalApproversPageProps {
  rows: FinalApproverRow[]
  unassignedCount: number
  unassignedOnly?: boolean
  onUnassignedOnlyChange?: (v: boolean) => void
  search?: string
  onSearchChange?: (v: string) => void
  pageSize?: number
  onRefresh?: () => void
  onAssign?: (r: FinalApproverRow) => void
  onHistory?: (r: FinalApproverRow) => void
}

/** Which person gives the final approval for each unit. */
export function FinalApproversPage({ rows, unassignedCount, unassignedOnly, onUnassignedOnlyChange, search, onSearchChange, pageSize = 50, onRefresh, onAssign, onHistory }: FinalApproversPageProps) {
  const columns: Column<FinalApproverRow>[] = [
    { key: "unit", header: "Đơn vị", cell: (r) => <><span className="flex items-center gap-2"><span className="block truncate text-sm leading-[1.35] font-[550] tracking-[-0.005em]">{r.unit}</span>{r.leadership && <Badge variant="info" className="flex-none px-1.5 py-0 text-micro">Cấp trưởng</Badge>}</span><span className="mt-0.5 block truncate text-label leading-[1.35] text-muted-foreground">{r.parentUnit}</span></> },
    { key: "approver", header: "Người duyệt cuối", cell: (r) => r.approver ? <span className="text-body font-medium">{r.approver}</span> : <><Badge variant="destructive">Chưa gán</Badge>{r.candidates && <span className="mt-1 block text-xs text-muted-foreground">{r.candidates}</span>}</> },
    { key: "since", header: "Từ ngày", width: 110, cell: (r) => r.since ?? <span className="text-subtle-foreground">—</span> },
    { key: "by", header: "Gán bởi · Lý do", cell: (r) => (r.assignedBy ? <>{r.assignedBy}<span className="block text-xs text-muted-foreground">{r.reason}</span></> : <span className="text-subtle-foreground">—</span>) },
    { key: "count", header: "Số lần đổi", width: 100, align: "right", className: "tabular-nums", cell: (r) => r.changeCount },
    { key: "__actions", header: <span className="sr-only">Thao tác</span>, width: 51, align: "center", cell: (r) => <DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`Thao tác với ${r.unit}`} title="Thao tác khác" onClick={(e) => e.stopPropagation()} className="grid size-[30px] cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-title leading-none text-subtle-foreground outline-none hover:bg-secondary hover:text-foreground data-[state=open]:bg-secondary">⋯</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onAssign?.(r)}>Gán người duyệt</DropdownMenuItem><DropdownMenuItem onSelect={() => onHistory?.(r)}>Lịch sử thay đổi</DropdownMenuItem></DropdownMenuContent></DropdownMenu> },
  ]
  return (
    <AdminPage>
      <AdminFilterBar hideKbd search={search} onSearchChange={onSearchChange} searchPlaceholder="Tên đơn vị, người duyệt…" onRefresh={onRefresh}
        filters={<FilterToggle pressed={!!unassignedOnly} title="Chỉ đơn vị chưa gán người duyệt cuối" onClick={() => onUnassignedOnlyChange?.(!unassignedOnly)}>Chưa gán <span className="rounded-[9px] bg-muted px-1.5 py-px font-mono text-label tabular-nums text-muted-foreground">{unassignedCount}</span></FilterToggle>}
        actions={<Button variant="outline" size="toolbar-icon" aria-label="Thông tin và hướng dẫn" title="Thông tin & Hướng dẫn" className="text-muted-foreground hover:text-foreground"><CircleHelp /></Button>} />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[971px]" rows={rows} getRowId={(r) => r.id} pageSize={pageSize} emptyTitle="Không có đơn vị" rowClassName={(r) => (r.approver ? undefined : "[&>td:first-child]:shadow-[inset_3px_0_0_var(--destructive)]")} />
    </AdminPage>
  )
}
