"use client"

// @dthu/ui 0.2.0 · block-admin
import { KeyRound, Plus, RotateCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { FilterToggle } from "@/components/blocks/shell/page-chrome"
import { AdminFilterBar, AdminFilterSelect, AdminPage } from "./parts"

export type RegistrationStatus = "draft" | "pending" | "approved" | "rejected"
export interface RegistrationRow { id: string; code: string; title: string; unit: string; status: RegistrationStatus; waitingFor?: string; submitter?: string; updatedAt: string }

export const registrationStatusLabel: Record<RegistrationStatus, string> = { draft: "Nháp", pending: "Chờ duyệt", approved: "Đã duyệt", rejected: "Từ chối" }
const statusVariant = { draft: "secondary", pending: "warning", approved: "success", rejected: "destructive" } as const

export function RegistrationStatusBadge({ status }: { status: RegistrationStatus }) {
  return <Badge variant={statusVariant[status]}>{registrationStatusLabel[status]}</Badge>
}

export interface RegistrationRequestsPageProps {
  rows: RegistrationRow[]
  tab: "mine" | "registered"
  onTabChange?: (t: "mine" | "registered") => void
  search?: string
  onSearchChange?: (v: string) => void
  statusFilter?: string
  onStatusFilterChange?: (v: string) => void
  onRefresh?: () => void
  onCreate?: () => void
  onOpen?: (r: RegistrationRow) => void
}

/** "Đơn của tôi": the user's own registration requests. */
export function RegistrationRequestsPage({ rows, tab, onTabChange, search, onSearchChange, statusFilter = "all", onStatusFilterChange, onRefresh, onCreate, onOpen }: RegistrationRequestsPageProps) {
  const columns: Column<RegistrationRow>[] = [
    { key: "stt", header: "STT", width: 45, align: "center", className: "tabular-nums text-muted-foreground", cell: (_r, i) => i + 1 },
    { key: "title", header: "Đơn đăng ký", cell: (r) => <><span className="block truncate text-sm leading-[1.35] font-[550] tracking-[-0.005em]">{r.title}</span><span className="mt-0.5 block truncate font-mono text-label leading-[1.35] text-muted-foreground">{r.code} · {r.unit}</span></> },
    { key: "status", header: "Trạng thái", width: 200, cell: (r) => <RegistrationStatusBadge status={r.status} /> },
    { key: "waiting", header: "Đang chờ", width: 190, cell: (r) => r.waitingFor ?? <span className="text-muted-foreground">—</span> },
    { key: "updated", header: "Cập nhật", width: 130, cell: (r) => r.updatedAt },
    { key: "act", header: "Thao tác", width: 140, align: "right", pin: "right", cell: (r) => <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onOpen?.(r) }}>Xem</Button> },
  ]
  return (
    <AdminPage>
      <AdminFilterBar
        search={search} onSearchChange={onSearchChange} searchPlaceholder="Tìm theo mã đơn (DK-…), tên đơn vị…" onRefresh={onRefresh} refreshIcon={<RotateCw />}
        filters={
          <>
            <FilterToggle pressed={tab === "mine"} onClick={() => onTabChange?.("mine")} className="order-first aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:text-primary-foreground">Đơn của tôi</FilterToggle>
            <FilterToggle pressed={tab === "registered"} onClick={() => onTabChange?.("registered")} className="order-first aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:text-primary-foreground"><KeyRound />Đã đăng ký</FilterToggle>
            <AdminFilterSelect label="Trạng thái" value={statusFilter} onChange={onStatusFilterChange} allLabel="Tất cả trạng thái" options={(Object.keys(registrationStatusLabel) as RegistrationStatus[]).map((k) => ({ value: k, label: registrationStatusLabel[k] }))} className="w-[230px]" />
          </>
        }
        actions={<Button size="toolbar" onClick={onCreate}><Plus />Tạo đơn đăng ký</Button>}
      />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[985px]" rows={tab === "mine" ? rows : []} getRowId={(r) => r.id} pageSize={25} emptyTitle="Chưa có đơn" onRowClick={onOpen} />
    </AdminPage>
  )
}
