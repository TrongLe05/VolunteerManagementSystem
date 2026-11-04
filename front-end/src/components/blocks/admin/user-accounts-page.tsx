"use client"

// @dthu/ui 0.2.0 · block-admin
import { ListFilter, Lock, LockOpen, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { DataTable, type Column } from "@/components/blocks/shell/data-table"
import { FilterButton, FilterToggle } from "@/components/blocks/shell/page-chrome"
import { AdminFilterSelect, AdminPage, AdminFilterBar } from "./parts"

export interface AdminUser {
  id: string
  name: string
  username: string
  initials: string
  unit: string
  position: string
  roles: string[]
  locked?: boolean
}

type Option = { value: string; label: string }

export interface UserAccountsPageProps {
  users: AdminUser[]
  search?: string
  onSearchChange?: (v: string) => void
  lockedOnly?: boolean
  onLockedOnlyChange?: (v: boolean) => void
  roleFilter?: string
  roleOptions?: Option[]
  onRoleFilterChange?: (v: string) => void
  unitFilter?: string
  unitOptions?: Option[]
  onUnitFilterChange?: (v: string) => void
  positionFilter?: string
  positionOptions?: Option[]
  onPositionFilterChange?: (v: string) => void
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (p: number) => void
  onPageSizeChange?: (s: number) => void
  onRefresh?: () => void
  onCreate?: () => void
  onExport?: () => void
  onEdit?: (u: AdminUser) => void
  onToggleLock?: (u: AdminUser) => void
  loading?: boolean
}

/** User account list: filter bar, table with roles/status and a row menu. */
export function UserAccountsPage({
  users, search, onSearchChange, lockedOnly, onLockedOnlyChange, roleFilter = "all", roleOptions = [], onRoleFilterChange, unitFilter = "all", unitOptions = [], onUnitFilterChange,
  positionFilter = "all", positionOptions = [], onPositionFilterChange, page, pageSize = 25, total, onPageChange, onPageSizeChange, onRefresh, onCreate, onExport, onEdit, onToggleLock, loading,
}: UserAccountsPageProps) {
  const columns: Column<AdminUser>[] = [
    { key: "stt", header: "STT", width: 45, align: "center", className: "tabular-nums text-muted-foreground", cell: (_u, i) => i + 1 },
    {
      key: "user", header: "Người dùng",
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden className="inline-grid size-[27px] flex-none place-items-center overflow-hidden rounded-full border border-[color-mix(in_srgb,var(--primary)_22%,var(--card))] bg-accent text-tiny leading-none font-bold text-primary uppercase select-none">{u.initials}</span>
          <span className="block min-w-0"><span className="block truncate text-body font-semibold" title={u.name}>{u.name}</span><span className="mt-[3px] block font-mono text-label font-medium whitespace-nowrap text-subtle-foreground">{u.username}</span></span>
        </div>
      ),
    },
    { key: "unit", header: "Đơn vị · Chức vụ", width: 274, cell: (u) => <><span className="block truncate text-sm leading-[1.35] font-[550] tracking-[-0.005em]" title={u.unit}>{u.unit}</span><span className="mt-0.5 block truncate text-label leading-[1.35] text-muted-foreground">{u.position}</span></> },
    {
      key: "roles", header: "Vai trò", width: 254,
      cell: (u) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant="info">Thành viên</Badge>
          {u.roles.slice(0, 1).map((r) => <Badge key={r} variant="info">{r}</Badge>)}
          {u.roles.length > 1 && <Badge variant="outline" title={u.roles.slice(1).join(", ")}>+{u.roles.length - 1}</Badge>}
        </div>
      ),
    },
    { key: "status", header: "Trạng thái", width: 134, cell: (u) => (u.locked ? <Badge variant="destructive" dot>Bị khoá</Badge> : <Badge variant="success" dot>Hoạt động</Badge>) },
    {
      key: "__actions", header: <span className="sr-only">Thao tác</span>, width: 51, align: "center",
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button type="button" aria-label={`Thao tác với ${u.name}`} title="Thao tác khác" onClick={(e) => e.stopPropagation()} className="grid size-[30px] cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-title leading-none text-subtle-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary data-[state=open]:bg-secondary">⋯</button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit?.(u)}><Pencil />Chỉnh sửa</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onToggleLock?.(u)}>{u.locked ? <LockOpen /> : <Lock />}{u.locked ? "Mở khoá" : "Khoá tài khoản"}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
  return (
    <AdminPage>
      <AdminFilterBar
        search={search} onSearchChange={onSearchChange} searchPlaceholder="Tìm họ tên hoặc tên tài khoản…" onRefresh={onRefresh}
        filters={
          <>
            <FilterToggle pressed={!!lockedOnly} className="order-first" onClick={() => onLockedOnlyChange?.(!lockedOnly)}>Đang bị khoá</FilterToggle>
            <AdminFilterSelect caret label="Vai trò" value={roleFilter} onChange={onRoleFilterChange} options={roleOptions} />
            <AdminFilterSelect label="Đơn vị" value={unitFilter} onChange={onUnitFilterChange} options={unitOptions} className="w-[240px]" />
            <AdminFilterSelect label="Chức vụ" value={positionFilter} onChange={onPositionFilterChange} options={positionOptions} className="w-[210px]" />
            <FilterButton aria-label="Bộ lọc" title="Bộ lọc" className="min-w-9 justify-center px-[9px] [&>svg]:size-[17px]"><ListFilter /></FilterButton>
          </>
        }
        actions={<><Button variant="outline" size="toolbar" title="Xuất danh sách tài khoản ra Excel" onClick={onExport}>Xuất danh sách</Button><Button size="toolbar" onClick={onCreate}>+ Tạo tài khoản</Button></>}
      />
      <DataTable columns={columns} className="max-md:min-h-80 max-md:shrink-0" minWidthClass="min-w-[1058px]" rows={users} getRowId={(u) => u.id} loading={loading} page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} onRowClick={onEdit} emptyTitle="Không có tài khoản" />
    </AdminPage>
  )
}
