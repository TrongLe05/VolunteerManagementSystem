"use client"

// @dthu/ui 0.2.0 · block-admin
import { CircleHelp, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { AdminFilterSelect, AdminPage, AdminFilterBar } from "./parts"

export interface AdminAssistantRow { id: string; leader: string; assistant: string; unit: string; permissions: string[]; docTypes: string; deadline?: string; note?: string; createdBy: string; status: "active" | "expired" }

export interface AdminAssistantsPageProps {
  rows: AdminAssistantRow[]
  search?: string
  onSearchChange?: (v: string) => void
  unitFilter?: string
  unitOptions?: { value: string; label: string }[]
  onUnitFilterChange?: (v: string) => void
  onRefresh?: () => void
  onAssign?: () => void
  onRevoke?: (r: AdminAssistantRow) => void
}

/** Admin view for assigning assistants on behalf of leaders. */
export function AdminAssistantsPage({ rows, search, onSearchChange, unitFilter = "all", unitOptions = [], onUnitFilterChange, onRefresh, onAssign, onRevoke }: AdminAssistantsPageProps) {
  const columns: Column<AdminAssistantRow>[] = [
    { key: "leader", header: "Lãnh đạo", cell: (r) => <span className="font-semibold">{r.leader}</span> },
    { key: "assistant", header: "Người hỗ trợ", cell: (r) => r.assistant },
    { key: "unit", header: "Đơn vị", cell: (r) => r.unit },
    { key: "perm", header: "Quyền", cell: (r) => <div className="flex flex-wrap gap-1">{r.permissions.map((p) => <Badge key={p} variant="info">{p}</Badge>)}</div> },
    { key: "doc", header: "Loại văn bản", cell: (r) => r.docTypes },
    { key: "deadline", header: "Hạn", width: 170, cell: (r) => r.deadline ?? <span className="text-muted-foreground">Không giới hạn</span> },
    { key: "by", header: "Tạo bởi · Ghi chú", cell: (r) => <div><div>{r.createdBy}</div>{r.note && <div className="text-xs text-muted-foreground">{r.note}</div>}</div> },
    { key: "status", header: "Trạng thái", width: 130, cell: (r) => <Badge variant={r.status === "active" ? "success" : "secondary"}>{r.status === "active" ? "Còn hiệu lực" : "Hết hạn"}</Badge> },
    { key: "__actions", header: <span className="sr-only">Thao tác</span>, width: 51, align: "center", cell: (r) => <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Thao tác với ${r.assistant}`}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onSelect={() => onRevoke?.(r)}>Thu hồi</DropdownMenuItem></DropdownMenuContent></DropdownMenu> },
  ]
  return (
    <AdminPage>
      <AdminFilterBar search={search} onSearchChange={onSearchChange} searchPlaceholder="Lãnh đạo, người hỗ trợ, ghi chú…" onRefresh={onRefresh}
        filters={<AdminFilterSelect label="Đơn vị" value={unitFilter} onChange={onUnitFilterChange} options={unitOptions} className="w-[260px]" />}
        hideKbd beforeRefresh={null} actions={<><Button variant="outline" size="toolbar-icon" aria-label="Thông tin và hướng dẫn" title="Thông tin & Hướng dẫn" className="text-muted-foreground hover:text-foreground"><CircleHelp /></Button><Button size="toolbar" onClick={onAssign}>+ Gán thay lãnh đạo</Button></>} />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[1441px]" rows={rows} getRowId={(r) => r.id} pageSize={50} emptyTitle="Chưa có người hỗ trợ" emptyDescription={<><span>Dữ liệu sẽ hiện ở đây khi có.</span><div className="mt-3"><Button onClick={onAssign}>Gán thay lãnh đạo</Button></div></>} />
    </AdminPage>
  )
}
