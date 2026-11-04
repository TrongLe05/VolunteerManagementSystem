"use client"

// @dthu/ui 0.2.0 · block-dashboard
import * as React from "react"
import { Briefcase, Camera, Clock, Lock, Mail, MapPin, Pencil, Phone, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { bdTokens } from "./tokens"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export type ProfileTone = "primary" | "warning" | "success" | "muted"
export interface ProfileSummary { id: string; icon: React.ReactNode; label: string; value: string; hint?: string; progress?: number; tone?: ProfileTone }
export interface ProfileNavGroup { label: string; items: { id: string; label: string; icon: React.ReactNode; dot?: boolean }[] }
export interface ProfileField { id: string; icon: React.ReactNode; label: string; value?: string; type?: "text" | "email" | "tel"; required?: boolean }
export type ProfileValues = Record<string, string>

export interface ProfilePageProps {
  coverSlot?: React.ReactNode
  initials: string
  name: string
  position: string
  department: string
  username: string
  roles: string[]
  lastAccess: string
  summaries: ProfileSummary[]
  nav: ProfileNavGroup[]
  activeNav: string
  onNavChange?: (id: string) => void
  fields: ProfileField[]
  /** Read-only "Công tác" fields shown in a second card (set by the administrator). */
  workFields?: ProfileField[]
  onEdit?: () => void
  onFieldAdd?: (id: string) => void
  /** Called with the validated values when the edit dialog is submitted. */
  onSave?: (values: ProfileValues) => void
  /** Footnote of the "Công tác" card. */
  workNote?: string
  /** Extra sections (password, PIN, certificate...) rendered under the "Công tác" card. */
  children?: React.ReactNode
}

export const profileDefaultIcons = { User, Briefcase, Phone, Mail, MapPin, Clock }

export const toneIcon: Record<ProfileTone, string> = { primary: "bg-accent text-primary", warning: "bg-warning/15 text-warning", success: "bg-success/15 text-success", muted: "bg-secondary text-muted-foreground" }
export const toneBar: Record<ProfileTone, string> = { primary: "bg-primary", warning: "bg-warning", success: "bg-success", muted: "bg-muted-foreground" }
export const toneText: Record<ProfileTone, string> = { primary: "text-foreground", warning: "text-warning", success: "text-foreground", muted: "text-foreground" }

export function validateProfileValues(fields: ProfileField[], values: ProfileValues): ProfileValues {
  const errors: ProfileValues = {}
  for (const f of fields) {
    const v = (values[f.id] ?? "").trim()
    if (f.required && !v) errors[f.id] = `${f.label} không được để trống`
    else if (v && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errors[f.id] = "Email không hợp lệ"
    else if (v && f.type === "tel" && !/^\+?[0-9 .]{9,13}$/.test(v)) errors[f.id] = "Số điện thoại không hợp lệ"
  }
  return errors
}

export function ProfilePage({ coverSlot, initials, name, position, department, username, roles, lastAccess, summaries, nav, activeNav, onNavChange, fields, workFields, onEdit, onFieldAdd, onSave, workNote = "Thông tin sai? Báo bộ phận hành chính hoặc quản trị hệ thống để điều chỉnh.", children }: ProfilePageProps) {
  const [values, setValues] = React.useState<ProfileValues>(() => Object.fromEntries(fields.map((f) => [f.id, f.value ?? ""])))
  const [draft, setDraft] = React.useState<ProfileValues>(values)
  const [errors, setErrors] = React.useState<ProfileValues>({})
  const [open, setOpen] = React.useState(false)
  const [focusId, setFocusId] = React.useState<string>()
  const [localNav, setLocalNav] = React.useState(activeNav)
  const current = onNavChange ? activeNav : localNav

  const openEdit = (id?: string) => { setDraft(values); setErrors({}); setFocusId(id); setOpen(true); if (id) onFieldAdd?.(id); else onEdit?.() }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateProfileValues(fields, draft)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const clean = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v.trim()]))
    setValues(clean); setOpen(false); onSave?.(clean)
  }
  const display = (f: ProfileField) => values[f.id] || undefined

  const card = "rounded-[14px] border border-(--bd-ke) bg-(--bd-mat) shadow-[0_1px_2px_#0b2e4a0d,0_4px_16px_#0b2e4a0f]"
  const row = "grid min-h-[54px] grid-cols-[200px_minmax(0,1fr)_auto] items-center gap-4 border-t border-[#eef2f5] px-5 py-3 first:border-t-0 max-md:grid-cols-[minmax(0,1fr)_auto] max-md:gap-x-3 max-md:gap-y-1 max-md:px-4 dark:border-border"
  const label = "flex items-center gap-2 text-body text-(--bd-chu-3) max-md:col-span-full [&_svg]:size-4 [&_svg]:text-(--bd-mo)"
  const sectionHead = (icon: React.ReactNode, title: string, hint: string, action?: React.ReactNode) => (
    <div className="flex items-start gap-3 px-5 pt-[17px] pb-[15px] max-md:px-4">
      <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-accent text-primary [&_svg]:size-[18px]">{icon}</span>
      <div className="min-w-0 flex-1"><h2 className="m-0 text-lead leading-[1.35] font-semibold text-(--bd-chu)">{title}</h2><p className="m-0 mt-0.5 text-small text-(--bd-chu-3)">{hint}</p></div>
      {action}
    </div>
  )
  return (
    <div className={cn(bdTokens, "pt-1 pb-24 text-(--bd-chu-2)")}>
      <section aria-label="Tóm tắt hồ sơ" className={cn(card, "overflow-hidden")}>
        <div className="relative h-[180px] overflow-hidden border-b border-(--bd-ke) bg-[#0b2e4a] max-md:h-[110px]">{coverSlot ?? <div className="size-full bg-[linear-gradient(135deg,#0b2e4a,#00568c_60%,#3a9ad9)]" />}</div>
        <div className="flex items-start gap-5 px-6 pt-3.5 pb-[18px] max-md:flex-col max-md:gap-3 max-md:px-4 max-md:pt-0 max-md:pb-4">
          <div className="relative -mt-[62px] shrink-0 max-md:-mt-12">
            <Avatar className="size-24 border-4 border-white shadow-[0_2px_8px_#0b2e4a29]"><AvatarFallback className="border-0 bg-success text-4xl font-medium tracking-[0.02em] text-success-foreground">{initials}</AvatarFallback></Avatar>
            <button type="button" aria-label="Đổi ảnh đại diện" className="absolute right-0.5 bottom-1 flex size-[30px] cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#0b2e4a] p-0 text-white outline-none hover:bg-primary focus-visible:ring-2 focus-visible:ring-ring"><Camera className="size-[15px]" /></button>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-heading leading-[1.25] font-semibold tracking-[-0.01em] [overflow-wrap:anywhere] text-(--bd-chu)">{name}</h1>
            <p className="m-0 mt-[3px] text-control"><b className="font-medium text-(--bd-chu)">{position}</b><span className="mx-1.5 text-(--bd-mo)">·</span><span>{department}</span></p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex h-6 items-center rounded-md border border-(--bd-ke) bg-(--bd-mat-2) px-[9px] font-mono text-label whitespace-nowrap">@{username}</span>
              {roles.map((r) => <span key={r} className="inline-flex h-6 items-center rounded-md border border-border bg-accent px-[9px] text-xs font-medium whitespace-nowrap text-accent-foreground dark:border-border">{r}</span>)}
            </div>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2 max-md:w-full max-md:flex-row max-md:items-center max-md:justify-between">
            <span className="flex items-center gap-1 text-xs text-(--bd-chu-3)"><Clock className="size-3.5" />Truy cập lần cuối {lastAccess}</span>
            <Button variant="outline" onClick={() => openEdit()}><Pencil />Sửa hồ sơ</Button>
          </div>
        </div>
        <div className="grid grid-cols-1 border-t border-(--bd-ke) min-[560px]:grid-cols-2 lg:grid-cols-4">
          {summaries.map((s, i) => {
            const tone = s.tone ?? "primary"
            const ico = tone === "success" ? "bg-[#e4f4f2] text-success dark:bg-success/15 dark:text-success" : tone === "warning" ? "bg-[#fbf2e3] text-warning dark:bg-warning/15 dark:text-warning" : "bg-(--bd-mat-2) text-(--bd-chu-3)"
            return (
              <div key={s.id} className={cn("flex items-start gap-3 border-(--bd-ke) px-5 py-3.5 hover:bg-(--bd-mat-2) max-lg:border-b lg:border-r lg:last:border-r-0", i === summaries.length - 1 && "max-lg:border-b-0")}>
                <span className={cn("flex size-[34px] shrink-0 items-center justify-center rounded-[9px] [&_svg]:size-[18px]", ico)}>{s.icon}</span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-label font-semibold tracking-[0.03em] text-(--bd-chu-3) uppercase">{s.label}</span>
                  <span className={cn("mt-px text-sm font-semibold text-(--bd-chu)", tone === "warning" && "text-warning dark:text-warning")}>{s.value}</span>
                  {s.hint && <span className="mt-px text-xs leading-[1.4] text-(--bd-chu-3)">{s.hint}</span>}
                  {s.progress !== undefined && (
                    <div role="progressbar" aria-label={s.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.progress} className={cn("mt-[7px] h-1 overflow-hidden rounded-full bg-(--bd-ke)", tone === "warning" ? "text-warning" : "text-success")}><div className="h-full rounded-[inherit] bg-current" style={{ width: `${s.progress}%` }} /></div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
      <div className="mt-5 grid min-w-0 grid-cols-[216px_minmax(0,1fr)] items-start gap-6 max-lg:grid-cols-1 max-lg:gap-3">
        <nav aria-label="Hồ sơ" className={cn(card, "sticky top-2 flex max-h-[calc(100vh-8rem)] flex-col gap-0.5 overflow-y-auto px-2 py-2.5 max-lg:static max-lg:flex-row max-lg:gap-1.5 max-lg:overflow-x-auto max-lg:border-0 max-lg:bg-transparent max-lg:p-0 max-lg:shadow-none")}>
          {nav.map((g, gi) => (
            <div key={g.label} className="flex flex-col gap-0.5 max-lg:flex-row max-lg:gap-1.5">
              <p className={cn("m-0 px-2.5 pb-1.5 text-caption font-bold tracking-[0.06em] text-(--bd-mo) uppercase max-lg:hidden", gi === 0 ? "pt-1" : "pt-3")}>{g.label}</p>
              {g.items.map((i) => (
                <button key={i.id} type="button" aria-current={i.id === current ? "page" : undefined} onClick={() => { setLocalNav(i.id); onNavChange?.(i.id) }} className={cn("relative flex h-[38px] w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 bg-transparent px-2.5 text-left text-control whitespace-nowrap text-(--bd-chu-2) outline-none transition-colors duration-[120ms] hover:bg-(--bd-mat-2) hover:text-(--bd-chu) focus-visible:shadow-focus max-lg:w-auto max-lg:shrink-0 max-lg:rounded-full max-lg:border max-lg:border-(--bd-ke) max-lg:bg-(--bd-mat) max-lg:text-body [&_svg]:size-[18px] [&_svg]:text-(--bd-mo)", i.id === current && "bg-accent font-semibold text-accent-foreground before:absolute before:top-2 before:bottom-2 before:-left-2 before:w-[3px] before:rounded-r-[3px] before:bg-primary before:content-[''] max-lg:border-primary max-lg:before:hidden [&_svg]:text-primary")}>
                  {i.icon}<span>{i.label}</span>{i.dot && <span aria-hidden className="ml-auto size-[7px] rounded-full bg-warning max-lg:ml-0" />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
          <section className={card} aria-label="Thông tin cá nhân">
            {sectionHead(<User />, "Thông tin cá nhân", "Hiển thị trên hồ sơ, danh bạ nội bộ và văn bản bạn xử lý.", <Button variant="outline" size="sm" onClick={() => openEdit()}><Pencil />Sửa</Button>)}
            <dl className="m-0 border-t border-(--bd-ke)">
              {fields.map((f) => (
                <div key={f.id} className={row}>
                  <dt className={label}>{f.icon}{f.label}</dt>
                  <dd className={cn("m-0 min-w-0 text-sm [overflow-wrap:anywhere]", display(f) ? "text-(--bd-chu)" : "text-(--bd-mo) italic")}>{display(f) ?? "Chưa cập nhật"}</dd>
                  <div>{!display(f) && <Button variant="ghost" size="sm" onClick={() => openEdit(f.id)} aria-label={`Thêm ${f.label.toLowerCase()}`}>Thêm</Button>}</div>
                </div>
              ))}
            </dl>
          </section>
          {workFields && (
            <section className={card} aria-label="Công tác">
              {sectionHead(<Briefcase />, "Công tác", "Do quản trị hệ thống cấp — bạn không tự sửa được.")}
              <dl className="m-0 border-t border-(--bd-ke)">
                {workFields.map((f) => (
                  <div key={f.id} className={row}>
                    <dt className={label}>{f.icon}{f.label}</dt>
                    <dd className="m-0 min-w-0 text-sm text-(--bd-chu) [overflow-wrap:anywhere]">{f.value ?? "—"}</dd>
                    <div />
                  </div>
                ))}
                {roles.length > 0 && (
                  <div className={row}><dt className={label}>Vai trò</dt><dd className="m-0 flex flex-wrap gap-1.5">{roles.map((r) => <span key={r} className="inline-flex h-6 items-center rounded-md border border-border bg-accent px-[9px] text-xs font-medium text-accent-foreground dark:border-border">{r}</span>)}</dd><div /></div>
                )}
                <div className={row}><dt className={label}>Tên đăng nhập</dt><dd className="m-0 font-mono text-body text-(--bd-chu)">{username}</dd><div /></div>
              </dl>
              <div className="flex items-center gap-2 rounded-b-[14px] border-t border-(--bd-ke) bg-(--bd-mat-2) px-5 py-[11px] text-small text-(--bd-chu-3) max-md:px-4"><Lock className="size-[15px]" />{workNote}</div>
            </section>
          )}
          {children}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 sm:max-w-md">
          <DialogHeader><DialogTitle>Sửa hồ sơ</DialogTitle><DialogDescription>Cập nhật thông tin cá nhân hiển thị trên hồ sơ của bạn.</DialogDescription></DialogHeader>
          <form noValidate onSubmit={submit}>
            <div className="grid gap-4 px-[18px] py-4">
            {fields.map((f) => (
              <div key={f.id} className="grid gap-1.5">
                <Label htmlFor={`profile-${f.id}`}>{f.label}{f.required && <span aria-hidden className="text-destructive"> *</span>}</Label>
                <Input id={`profile-${f.id}`} type={f.type ?? "text"} autoFocus={f.id === focusId} value={draft[f.id] ?? ""} aria-invalid={errors[f.id] ? true : undefined} aria-describedby={errors[f.id] ? `profile-${f.id}-err` : undefined} onChange={(e) => setDraft((d) => ({ ...d, [f.id]: e.target.value }))} />
                {errors[f.id] && <p id={`profile-${f.id}-err`} role="alert" className="text-xs text-destructive">{errors[f.id]}</p>}
              </div>
            ))}
            </div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit">Lưu</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
