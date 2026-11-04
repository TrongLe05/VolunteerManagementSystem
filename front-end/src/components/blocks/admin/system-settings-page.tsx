"use client"

// @dthu/ui 0.2.0 · block-admin
import * as React from "react"
import { Pencil, Settings, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface SettingItem { key: string; label: string; description: string; value: number; min: number; max: number; unit: string; defaultValue: number; note?: string }
export interface SettingSection { id: string; label: string; icon?: React.ReactNode; description: string; items: SettingItem[] }

export interface SystemSettingsPageProps {
  sections: SettingSection[]
  activeId: string
  onActiveChange?: (id: string) => void
  onChange?: (key: string, value: number) => void
  dirtyCount?: number
  onSave?: () => void
  onReset?: () => void
}

const card = "rounded-[14px] border border-border bg-card shadow-[0_1px_2px_rgba(11,46,74,.05),0_4px_16px_rgba(11,46,74,.06)]"
const rowInput = "h-auto min-h-9 w-full"

/** System settings (reference `hs ch`): cover + summary tiles, anchor navigation and one editable card per function. */
export function SystemSettingsPage({ sections, activeId, onActiveChange, onChange, dirtyCount = 0, onSave, onReset }: SystemSettingsPageProps) {
  const go = (id: string) => { onActiveChange?.(id); try { document.getElementById(`ch-${id}`)?.scrollIntoView?.({ behavior: "smooth", block: "start" }) } catch { /* jsdom */ } }
  return (
    <div className="h-full overflow-auto pt-1 pb-24 text-muted-foreground">
      <section className={cn(card, "overflow-hidden")}>
        <div aria-hidden className="relative h-[200px] overflow-hidden border-b border-border bg-[#0b2e4a] max-[992px]:h-[140px] max-[575px]:h-[110px]">
          <div className="absolute inset-0 bg-[radial-gradient(120%_140%_at_85%_10%,rgba(10,116,181,.55),transparent_55%),radial-gradient(90%_120%_at_10%_100%,rgba(0,86,140,.6),transparent_60%),linear-gradient(rgba(11,46,74,.04),rgba(11,46,74,.26))]" />
          <svg className="absolute inset-0 size-full text-white" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 200" fill="none" stroke="currentColor">
            <circle cx="640" cy="60" r="90" strokeOpacity="0.12" strokeWidth="2" /><circle cx="640" cy="60" r="56" strokeOpacity="0.12" strokeWidth="2" /><circle cx="130" cy="150" r="40" strokeOpacity="0.1" strokeWidth="2" />
            <path d="M0 170 Q150 130 300 160 T600 150 T800 165 V200 H0Z" fill="currentColor" fillOpacity="0.06" stroke="none" />
          </svg>
        </div>
        <div className="flex items-start gap-5 px-6 pt-3.5 pb-[18px] max-[575px]:flex-col max-[575px]:gap-3 max-[575px]:px-4 max-[575px]:pt-0 max-[575px]:pb-4">
          <span className="relative z-[1] -mt-[54px] flex size-[84px] flex-none items-center justify-center rounded-[20px] border-4 border-white bg-[linear-gradient(135deg,#00568c,#0a74b5)] text-white shadow-[0_2px_8px_rgba(11,46,74,.16)] max-[575px]:-mt-11 max-[575px]:size-[72px] [&_svg]:size-[38px] max-[575px]:[&_svg]:size-8"><Settings aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-heading leading-[1.25] font-semibold tracking-[-0.01em] text-foreground">Cấu hình hệ thống</h2>
            <p className="mt-[3px] mb-0 max-w-[640px] text-control leading-normal">Giới hạn và thời hạn của từng chức năng, dùng chung cho mọi người dùng. Lưu xong có hiệu lực ngay, không cần khởi động lại.</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="inline-flex h-6 items-center whitespace-nowrap rounded-md border border-border bg-secondary px-[9px] text-xs"><Zap aria-hidden className="mr-[5px] size-3.5 flex-none align-[-2px] text-subtle-foreground" />Có hiệu lực ngay</span>
              <span className="inline-flex h-6 items-center whitespace-nowrap rounded-md border border-border bg-secondary px-[9px] text-xs"><Pencil aria-hidden className="mr-[5px] size-3.5 flex-none align-[-2px] text-subtle-foreground" />{dirtyCount} mục đã chỉnh so với file</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 border-t border-border max-[992px]:grid-cols-2 max-[575px]:grid-cols-1">
          {sections.map((s) => (
            <button key={s.id} type="button" onClick={() => go(s.id)} className="flex cursor-pointer items-start gap-3 border-0 border-r border-border bg-transparent px-5 py-3.5 text-left transition-colors outline-none last:border-r-0 hover:bg-secondary focus-visible:shadow-[inset_0_0_0_2px_var(--ring)] max-[992px]:odd:border-r max-[992px]:[&:nth-child(2n)]:border-r-0 max-[992px]:[&:nth-child(-n+2)]:border-b max-[575px]:border-r-0 max-[575px]:border-b">
              <span className="flex size-[34px] flex-none items-center justify-center rounded-[9px] bg-secondary text-subtle-foreground [&_svg]:size-[18px]">{s.icon ?? <Settings />}</span>
              <span className="flex min-w-0 flex-1 flex-col"><span className="text-label font-semibold tracking-[0.03em] text-subtle-foreground uppercase">{s.label}</span><span className="mt-px text-sm font-semibold text-foreground">{s.items.some((i) => i.value !== i.defaultValue) ? "Đã tuỳ chỉnh" : "Theo file/mặc định"}</span><span className="mt-px text-xs leading-[1.4] text-subtle-foreground">{s.items.length} cấu hình</span></span>
            </button>
          ))}
        </div>
      </section>
      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[216px_minmax(0,1fr)] max-[992px]:mt-3 max-[992px]:grid-cols-1 max-[992px]:gap-3">
        <nav aria-label="Chức năng" className={cn(card, "sticky top-3 flex max-h-[calc(100vh-128px)] flex-col gap-0.5 overflow-y-auto px-2 py-2.5 max-[992px]:static max-[992px]:flex-row max-[992px]:overflow-x-auto max-[992px]:border-0 max-[992px]:bg-transparent max-[992px]:p-0 max-[992px]:shadow-none")}>
          <div className="px-2.5 pt-1 pb-1.5 text-caption font-bold tracking-[0.06em] text-subtle-foreground uppercase max-[992px]:hidden">Chức năng</div>
          {sections.map((s) => <button key={s.id} type="button" aria-current={s.id === activeId ? "true" : undefined} onClick={() => go(s.id)} className="group/n relative flex h-[38px] w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 bg-transparent px-2.5 text-left text-control text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-foreground focus-visible:shadow-focus max-[992px]:w-auto max-[992px]:flex-none max-[992px]:rounded-full max-[992px]:border max-[992px]:border-border max-[992px]:bg-card [&_svg]:size-[18px] [&_svg]:flex-none [&_svg]:text-subtle-foreground hover:[&_svg]:text-subtle-foreground">{s.icon ?? <Settings />}{s.label}</button>)}
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
          {sections.map((sec) => (
            <section key={sec.id} id={`ch-${sec.id}`} className={cn(card, "scroll-mt-4")}>
              <div className="flex items-start gap-3 px-5 pt-4 pb-3.5">
                <span className="flex size-[34px] flex-none items-center justify-center rounded-[9px] bg-accent text-primary [&_svg]:size-[18px]">{sec.icon ?? <Settings />}</span>
                <div className="min-w-0 flex-1"><h3 className="m-0 text-lead leading-[1.35] font-semibold text-foreground">{sec.label}</h3><p className="mt-0.5 mb-0 text-small text-subtle-foreground">{sec.description}</p></div>
              </div>
              <div className="border-t border-border">
                {sec.items.map((it) => (
                  <div key={it.key} className="grid grid-cols-[minmax(0,1fr)_minmax(180px,280px)] items-center gap-x-6 gap-y-2 border-t border-border/60 px-5 py-3.5 first:border-t-0 hover:bg-secondary max-[575px]:grid-cols-1 max-[575px]:px-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-control font-medium text-foreground">{it.label}<span className={cn("inline-flex h-[18px] items-center rounded-full border px-[7px] text-caption font-semibold", it.value === it.defaultValue ? "border-border bg-secondary text-subtle-foreground" : "border-border bg-accent text-primary")}>{it.value === it.defaultValue ? "Mặc định" : "File"}</span></div>
                      <div className="mt-0.5 text-small text-subtle-foreground">{it.description}</div>
                      {it.note && <div className="mt-1 text-xs text-warning">{it.note}</div>}
                    </div>
                    <div className="flex min-w-0 items-center justify-end gap-2 max-[575px]:justify-start"><Input type="number" aria-label={it.label} value={it.value} min={it.min} max={it.max} onChange={(e) => onChange?.(it.key, Number(e.target.value))} className={cn(rowInput, "w-[120px] max-w-full text-control")} /><span className="text-small whitespace-nowrap text-subtle-foreground">{it.unit} <span className="text-muted-foreground">({it.min}–{it.max})</span></span></div>
                  </div>
                ))}
              </div>
            </section>
          ))}
          <div className="flex items-center justify-end gap-2 rounded-[14px] border border-border bg-secondary px-5 py-3.5 max-[575px]:flex-wrap max-[575px]:px-4"><Button variant="outline" size="toolbar" onClick={onReset}>Đặt lại mặc định</Button><Button size="toolbar" onClick={onSave} disabled={dirtyCount === 0}>Lưu cấu hình</Button></div>
        </div>
      </div>
    </div>
  )
}
