"use client"

// @dthu/ui 0.2.0 · block-admin
import { ListFilter, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { FilterButton } from "@/components/blocks/shell/page-chrome"
import { AdminFilterSelect, AdminPage, AdminSegmented, AdminFilterBar } from "./parts"
import { RegistrationStatusBadge, type RegistrationRow, registrationStatusLabel, type RegistrationStatus } from "./registration-requests-page"

export type ApprovalTab = "waiting" | "handled" | "all"
export interface ApprovalRow extends RegistrationRow { submitter: string; submittedAt: string }

export interface RegistrationApprovalQueueProps {
  rows: ApprovalRow[]
  tab: ApprovalTab
  onTabChange?: (t: ApprovalTab) => void
  search?: string
  onSearchChange?: (v: string) => void
  unitFilter?: string
  unitOptions?: { value: string; label: string }[]
  onUnitFilterChange?: (v: string) => void
  statusFilter?: string
  onStatusFilterChange?: (v: string) => void
  onRefresh?: () => void
  onApprove?: (r: ApprovalRow) => void
  onReject?: (r: ApprovalRow) => void
}

/** Approver queue for registration requests. */
export function RegistrationApprovalQueue({ rows, tab, onTabChange, search, onSearchChange, unitFilter = "all", unitOptions = [], onUnitFilterChange, statusFilter = "all", onStatusFilterChange, onRefresh, onApprove, onReject }: RegistrationApprovalQueueProps) {
  const columns: Column<ApprovalRow>[] = [
    { key: "stt", header: "STT", width: 45, align: "center", className: "tabular-nums text-muted-foreground", cell: (_r, i) => i + 1 },
    { key: "title", header: "Đơn đăng ký", cell: (r) => <><span className="block truncate text-sm leading-[1.35] font-[550] tracking-[-0.005em]">{r.title}</span><span className="mt-0.5 block truncate font-mono text-label leading-[1.35] text-muted-foreground">{r.code} · {r.unit}</span></> },
    { key: "status", header: "Trạng thái", width: 200, cell: (r) => <RegistrationStatusBadge status={r.status} /> },
    { key: "submitter", header: "Người nộp", width: 210, cell: (r) => r.submitter },
    { key: "waiting", header: "Đang chờ", width: 170, cell: (r) => r.waitingFor ?? <span className="text-muted-foreground">—</span> },
    { key: "at", header: "Nộp lúc", width: 130, cell: (r) => r.submittedAt },
    {
      key: "act", header: "Thao tác", width: 110, align: "right", pin: "right",
      cell: (r) => r.status === "pending" ? <div className="flex justify-end gap-1.5"><Button size="sm" onClick={() => onApprove?.(r)}>Duyệt</Button><Button size="sm" variant="outline" onClick={() => onReject?.(r)}>Từ chối</Button></div> : null,
    },
  ]
  const data = tab === "waiting" ? rows.filter((r) => r.status === "pending") : tab === "handled" ? rows.filter((r) => r.status !== "pending") : rows
  return (
    <AdminPage>
      <AdminFilterBar
        search={search} onSearchChange={onSearchChange} searchPlaceholder="Tìm theo mã đơn (DK-…), đơn vị, người nộp…"
        filters={
          <>
            <AdminSegmented variant="toggles" label="Hàng đợi" value={tab} onChange={onTabChange} className="order-first" options={[{ value: "waiting", label: "Chờ tôi duyệt" }, { value: "handled", label: "Đã xử lý" }, { value: "all", label: "Tất cả" }]} />
            <AdminFilterSelect label="Đơn vị" value={unitFilter} onChange={onUnitFilterChange} options={unitOptions} allLabel="Tất cả đơn vị" className="w-[228px]" />
            <AdminFilterSelect label="Trạng thái" value={statusFilter} onChange={onStatusFilterChange} options={(Object.keys(registrationStatusLabel) as RegistrationStatus[]).map((k) => ({ value: k, label: registrationStatusLabel[k] }))} className="w-[210px]" />
            <FilterButton aria-label="Bộ lọc nâng cao" title="Bộ lọc" className="min-w-9 justify-center px-[9px] [&>svg]:size-[17px]"><ListFilter /></FilterButton>
          </>
        }
        onRefresh={onRefresh} refreshIcon={<RotateCw />}
      />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[1165px]" rows={data} getRowId={(r) => r.id} pageSize={25} emptyTitle={tab === "waiting" ? "Không có đơn chờ duyệt" : "Không có đơn"} />
    </AdminPage>
  )
}
