"use client"

// @dthu/ui 0.2.0 · block-admin
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { AdminFilterBar, AdminPage, AdminSegmented } from "./parts"

export interface SupportIncident { id: string; title: string; scope: string; status: "investigating" | "fixing" | "resolved"; startedAt: string; ticketCode?: string }
const label = { investigating: "Đang điều tra", fixing: "Đang khắc phục", resolved: "Đã xử lý" }
const variant = { investigating: "warning", fixing: "info", resolved: "success" } as const

export interface SupportIncidentsPageProps {
  incidents: SupportIncident[]
  activeCount: number
  tab: "active" | "recent"
  onTabChange?: (t: "active" | "recent") => void
  onRefresh?: () => void
  onReport?: () => void
}

/** Incident list; banner shows on affected pages while an incident is being fixed. */
export function SupportIncidentsPage({ incidents, activeCount, tab, onTabChange, onRefresh, onReport }: SupportIncidentsPageProps) {
  const columns: Column<SupportIncident>[] = [
    { key: "title", header: "Sự cố", cell: (i) => <span className="block truncate text-sm font-[550] tracking-[-0.005em]">{i.title}</span> },
    { key: "scope", header: "Phạm vi", width: 240, cell: (i) => i.scope },
    { key: "status", header: "Trạng thái", width: 140, cell: (i) => <Badge variant={variant[i.status]}>{label[i.status]}</Badge> },
    { key: "time", header: "Thời gian", width: 190, cell: (i) => i.startedAt },
    { key: "ticket", header: "Phiếu gắn", width: 110, align: "right", cell: (i) => (i.ticketCode ? <span className="font-mono text-label">{i.ticketCode}</span> : <span className="text-muted-foreground">—</span>) },
    { key: "__actions", header: <span className="sr-only">Thao tác</span>, width: 51, cell: () => null },
  ]
  return (
    <AdminPage>
      <AdminFilterBar hideSearch onRefresh={onRefresh}
        filters={
          <>
            <AdminSegmented variant="solid" label="Phạm vi thời gian" value={tab} onChange={onTabChange} options={[{ value: "active", label: "Đang khắc phục", count: activeCount }, { value: "recent", label: "90 ngày gần nhất" }]} />
            <span className="min-w-0 truncate text-small whitespace-nowrap text-subtle-foreground max-[900px]:hidden">Banner hiện cho người dùng trên các trang thuộc phạm vi của sự cố đang khắc phục.</span>
          </>
        }
        actions={<Button size="toolbar" onClick={onReport}><Plus />Báo sự cố</Button>} />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[1031px]" rows={incidents} getRowId={(i) => i.id} pageSize={25} emptyTitle="Không có sự cố" />
    </AdminPage>
  )
}
