"use client"

// @dthu/ui 0.2.0 · block-admin
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import type { AdminUser } from "./user-accounts-page"

export interface UserEditValues { name: string; unit: string; position: string; roles: string[]; locked: boolean }

export interface UserEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  roleOptions: string[]
  onSave?: (user: AdminUser, values: UserEditValues) => void
}

function Form({ user, roleOptions, onCancel, onSave }: { user: AdminUser; roleOptions: string[]; onCancel: () => void; onSave?: UserEditSheetProps["onSave"] }) {
  const [v, setV] = React.useState<UserEditValues>({ name: user.name, unit: user.unit, position: user.position, roles: user.roles, locked: !!user.locked })
  const toggleRole = (r: string, on: boolean) => setV((p) => ({ ...p, roles: on ? [...p.roles, r] : p.roles.filter((x) => x !== r) }))
  return (
    <form className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave?.(user, v) }}>
      <div className="grid flex-1 content-start gap-4 overflow-auto">
        <div className="grid gap-1.5"><Label htmlFor="ue-user">Tài khoản</Label><Input id="ue-user" value={user.username} disabled className="font-mono" /></div>
        <div className="grid gap-1.5"><Label htmlFor="ue-name">Họ và tên</Label><Input id="ue-name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label htmlFor="ue-unit">Đơn vị</Label><Input id="ue-unit" value={v.unit} onChange={(e) => setV({ ...v, unit: e.target.value })} /></div>
        <div className="grid gap-1.5"><Label htmlFor="ue-pos">Chức vụ</Label><Input id="ue-pos" value={v.position} onChange={(e) => setV({ ...v, position: e.target.value })} /></div>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Vai trò</legend>
          {roleOptions.map((r) => (
            <div key={r} className="flex items-center gap-2"><Checkbox id={`ue-r-${r}`} checked={v.roles.includes(r)} onCheckedChange={(c) => toggleRole(r, c === true)} /><Label htmlFor={`ue-r-${r}`} className="font-normal">{r}</Label></div>
          ))}
        </fieldset>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div><Label htmlFor="ue-lock">Khoá tài khoản</Label><p className="text-xs text-muted-foreground">Người dùng bị khoá không thể đăng nhập.</p></div>
          <Switch id="ue-lock" checked={v.locked} onCheckedChange={(c) => setV({ ...v, locked: c })} />
        </div>
      </div>
      <SheetFooter className="flex-row justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Huỷ</Button><Button type="submit">Lưu thay đổi</Button></SheetFooter>
    </form>
  )
}

/** Right-hand sheet to edit one account. */
export function UserEditSheet({ open, onOpenChange, user, roleOptions, onSave }: UserEditSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader><SheetTitle>Chỉnh sửa tài khoản</SheetTitle><SheetDescription>{user ? user.name : "Chọn một tài khoản"}</SheetDescription></SheetHeader>
        {user && <Form key={user.id} user={user} roleOptions={roleOptions} onCancel={() => onOpenChange(false)} onSave={onSave} />}
      </SheetContent>
    </Sheet>
  )
}
