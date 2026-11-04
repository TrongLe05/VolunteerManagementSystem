"use client"

// @dthu/ui 0.2.0 · block-admin
import { ArrowDown, ArrowUp, CircleHelp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { AdminPage, AdminSegmented, AdminFilterBar } from "./parts"

export interface RejectionReason { id: string; name: string; code: string; note?: string; requireText?: boolean; active: boolean }
export type ReasonDocKind = "outgoing" | "incoming"
export type ReasonAction = "reject" | "recall"

export interface RejectionReasonsPageProps {
  reasons: RejectionReason[]
  docKind: ReasonDocKind
  onDocKindChange?: (k: ReasonDocKind) => void
  action: ReasonAction
  onActionChange?: (a: ReasonAction) => void
  search?: string
  onSearchChange?: (v: string) => void
  onRefresh?: () => void
  onAdd?: () => void
  onMove?: (r: RejectionReason, dir: -1 | 1) => void
  onEdit?: (r: RejectionReason) => void
  onToggle?: (r: RejectionReason) => void
}

/** Template reasons for rejecting/recalling documents, with ordering. */
export function RejectionReasonsPage({ reasons, docKind, onDocKindChange, action, onActionChange, search, onSearchChange, onRefresh, onAdd, onMove, onEdit, onToggle }: RejectionReasonsPageProps) {
  const columns: Column<RejectionReason>[] = [
    {
      key: "order", header: "Thứ tự", width: 104,
      cell: (r, i) => (
        <div className="flex items-center gap-1"><span className="w-5 text-body tabular-nums text-muted-foreground">{i + 1}</span>
          <button type="button" className="grid size-6 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent [&_svg]:size-4" aria-label={`Đưa lên: ${r.name}`} disabled={i === 0} onClick={() => onMove?.(r, -1)}><ArrowUp /></button>
          <button type="button" className="grid size-6 cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent [&_svg]:size-4" aria-label={`Đưa xuống: ${r.name}`} disabled={i === reasons.length - 1} onClick={() => onMove?.(r, 1)}><ArrowDown /></button>
        </div>
      ),
    },
    { key: "name", header: "Tên lý do", cell: (r) => <span className="block truncate text-sm font-[550] tracking-[-0.005em]">{r.name}</span> },
    { key: "code", header: "Mã", width: 190, cell: (r) => <span className="font-mono text-label font-medium whitespace-nowrap text-subtle-foreground">{r.code}</span> },
    { key: "note", header: "Ghi chú", cell: (r) => r.note ?? "" },
    { key: "req", header: "Bắt buộc nhập", width: 130, cell: (r) => (r.requireText ? <Badge variant="warning">Bắt buộc</Badge> : <span className="text-subtle-foreground">—</span>) },
    { key: "status", header: "Trạng thái", width: 110, cell: (r) => (r.active ? <Badge variant="success" dot>Đang hiện</Badge> : <Badge variant="secondary">Đang ẩn</Badge>) },
    { key: "__actions", header: <span className="sr-only">Thao tác</span>, width: 51, align: "center", cell: (r) => <DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`Thao tác với ${r.name}`} title="Thao tác khác" className="grid size-[30px] cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-title leading-none text-subtle-foreground outline-none hover:bg-secondary hover:text-foreground data-[state=open]:bg-secondary">⋯</button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => onEdit?.(r)}>Chỉnh sửa</DropdownMenuItem><DropdownMenuItem onSelect={() => onToggle?.(r)}>{r.active ? "Ẩn" : "Hiện"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu> },
  ]
  return (
    <AdminPage>
      <AdminFilterBar hideKbd search={search} onSearchChange={onSearchChange} searchPlaceholder="Tên, mã, ghi chú…" onRefresh={onRefresh}
        filters={<>
          <AdminSegmented variant="solid" label="Loại văn bản" value={docKind} onChange={onDocKindChange} className="order-first" options={[{ value: "outgoing", label: "Văn bản đi" }, { value: "incoming", label: "Văn bản đến" }]} />
          <AdminSegmented variant="solid" label="Hành động" value={action} onChange={onActionChange} className="order-first" options={[{ value: "reject", label: "Từ chối" }, { value: "recall", label: "Thu hồi" }]} />
        </>}
        actions={<><Button size="toolbar" onClick={onAdd}>+ Thêm lý do</Button><Button variant="outline" size="toolbar-icon" aria-label="Hướng dẫn lý do mẫu" title="Hướng dẫn lý do mẫu" className="text-muted-foreground hover:text-foreground"><CircleHelp /></Button></>} />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[1025px]" rows={reasons} getRowId={(r) => r.id} pageSize={100} emptyTitle="Chưa có lý do" />
    </AdminPage>
  )
}
