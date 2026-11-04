"use client"

// @dthu/ui 0.2.0 · block-admin
import { ShieldCheck, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MatrixRole { id: string; name: string; code: string; userCount: number; initials?: string[] }
export interface MatrixPermission { code: string; label: string }
export interface MatrixGroup { id: string; label: string; permissions: MatrixPermission[] }

export interface RolePermissionMatrixProps {
  roles: MatrixRole[]
  groups: MatrixGroup[]
  /** role id -> granted permission codes */
  granted: Record<string, string[]>
  totalPermissions?: number
  onToggle?: (roleId: string, permissionCode: string, value: boolean) => void
  className?: string
}

/** Avatar fills of the reference role cards (`qp-chip-avatar`), cycled by position. */
const AVATAR_BG = ["#9e2751", "#8c5a2a", "#1f5fa8", "#0e6b57", "#7a4b8c", "#a35a13", "#3f6b2a"]
const mono = "font-[SFMono-Regular,Menlo,Consolas,monospace]"
const shadow = "shadow-[0_0_13px_0_rgba(236,236,241,.44)]"

/** Role cards on top and a permission x role switch matrix below (reference `qp-*`). The shell's <main> pads the page. */
export function RolePermissionMatrix({ roles, groups, granted, totalPermissions, onToggle, className }: RolePermissionMatrixProps) {
  const total = totalPermissions ?? groups.reduce((n, g) => n + g.permissions.length, 0)
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="mb-2 flex-none">
        <div className="flex gap-2.5 overflow-x-auto px-0.5 pt-0.5 pb-3" aria-label="Danh sách vai trò" role="list">
          {roles.map((r) => (
            <div key={r.id} role="listitem" className={cn("w-[200px] flex-none rounded-lg border border-border bg-card p-3 max-[575px]:w-[150px] max-[575px]:px-2.5 max-[575px]:py-2", shadow)}>
              <div className="flex items-start justify-between gap-1.5"><div className="truncate text-sm font-bold text-primary max-[575px]:text-body" title={r.name}>{r.name}</div><ShieldCheck className="size-[18px] flex-none text-[#02a499]" aria-hidden /></div>
              <div className="mt-1.5 flex items-center justify-between text-label"><span className={cn("rounded border border-border bg-secondary px-1.5 py-px text-muted-foreground", mono)}>{r.code}</span><span className="font-semibold text-primary">{granted[r.id]?.length ?? 0}/{total} quyền</span></div>
              <div className="mt-2.5 flex items-center">
                {(r.initials ?? []).slice(0, 4).map((ini, i) => (
                  <span key={i} role="img" aria-label={ini} style={{ backgroundColor: AVATAR_BG[(roles.indexOf(r) + i) % AVATAR_BG.length], zIndex: 4 - i }} className="relative -mr-2 inline-grid size-[26px] place-items-center rounded-full border-2 border-white text-micro leading-none font-bold text-white">{ini}</span>
                ))}
                <span className="ml-auto flex items-center gap-[3px] text-xs text-muted-foreground"><Users className="size-3.5" aria-hidden />{r.userCount}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={cn("min-h-[200px] flex-1 overflow-auto rounded-lg border border-border bg-card", shadow)}>
        <div className="relative min-h-full w-max min-w-full">
          <table className="w-full border-separate border-spacing-0 text-control">
            <thead>
              <tr>
                <th className="sticky top-0 left-0 z-[6] w-[280px] min-w-[280px] border-r border-b-2 border-b-border bg-secondary px-3.5 py-2.5 text-left font-semibold text-muted-foreground shadow-[2px_0_4px_rgba(0,0,0,.04)]">Tên quyền / Mã</th>
                {roles.map((r) => (
                  <th key={r.id} className="sticky top-0 z-[4] w-[130px] min-w-[130px] border-b-2 border-b-border bg-secondary px-3.5 py-2.5 text-center font-semibold text-muted-foreground"><div className="truncate font-semibold text-foreground">{r.name}</div><div className={cn("mt-0.5 text-caption text-muted-foreground", mono)}>{r.code}</div></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <GroupRows key={g.id} group={g} roles={roles} granted={granted} onToggle={onToggle} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/** Reference `qp-switch`: 34x20 track, 16px thumb; hidden native checkbox keeps it accessible. */
function MatrixSwitch({ checked, onChange, label }: { checked: boolean; onChange?: (v: boolean) => void; label: string }) {
  return (
    <label className="relative inline-block h-5 w-[34px] cursor-pointer align-middle">
      <input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={(e) => onChange?.(e.target.checked)} className="peer absolute m-0 size-full cursor-pointer opacity-0" />
      <span aria-hidden className="absolute inset-0 rounded-[10px] bg-[#ced4da] transition-colors duration-150 peer-checked:bg-primary peer-focus-visible:shadow-focus peer-disabled:opacity-50" />
      <span aria-hidden className="absolute top-0.5 left-0.5 size-4 rounded-full bg-card shadow-[0_1px_2px_rgba(0,0,0,.25)] transition-transform duration-150 peer-checked:translate-x-3.5" />
    </label>
  )
}

function GroupRows({ group, roles, granted, onToggle }: { group: MatrixGroup; roles: MatrixRole[]; granted: Record<string, string[]>; onToggle?: RolePermissionMatrixProps["onToggle"] }) {
  return (
    <>
      <tr>
        <td colSpan={roles.length + 1} className="bg-secondary px-3.5 py-[7px] text-label font-bold tracking-[0.4px] text-primary uppercase"><span className="sticky left-3.5 inline-flex max-w-fit items-center gap-1.5">{group.label}<span className="ml-1.5 inline-block rounded-[9px] border border-border bg-card px-[7px] text-tiny font-bold">{group.permissions.length}</span></span></td>
      </tr>
      {group.permissions.map((p) => (
        <tr key={p.code} className="group/row">
          <td className="sticky left-0 z-[3] w-[280px] min-w-[280px] border-r border-b border-b-border/60 bg-card px-3.5 py-2 shadow-[2px_0_4px_rgba(0,0,0,.04)] group-hover/row:bg-secondary"><div className="font-semibold text-foreground">{p.label}</div><div className={cn("mt-px text-caption text-muted-foreground", mono)}>{p.code}</div></td>
          {roles.map((r) => (
            <td key={r.id} className="border-b border-b-border/60 bg-card text-center align-middle group-hover/row:bg-secondary"><MatrixSwitch label={`${p.label} – ${r.name}`} checked={granted[r.id]?.includes(p.code) ?? false} onChange={(v) => onToggle?.(r.id, p.code, v)} /></td>
          ))}
        </tr>
      ))}
    </>
  )
}
