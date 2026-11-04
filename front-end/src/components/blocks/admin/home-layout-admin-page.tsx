"use client"

// @dthu/ui 0.2.0 · block-admin
import * as React from "react"
import { FoldHorizontal, Plus } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AdminSegmented } from "./parts"

export interface HomeTemplate { id: string; name: string; isDefault?: boolean; description: string; priority: number; recipients: number }
export interface HomeWidgetSlot { id: string; title: string; column: "main" | "side"; fullWidth?: boolean; required?: boolean; body?: React.ReactNode }

export type HomeWidgetZone = "full" | "main" | "side"
export interface HomeCatalogWidget { id: string; title: string; description: string; defaultZone: HomeWidgetZone; enabled: boolean; roles: string; inTemplate?: boolean }
const zoneOf = (w: HomeWidgetSlot): HomeWidgetZone => (w.column === "side" ? "side" : w.fullWidth ? "full" : "main")

export interface HomeLayoutAdminPageProps {
  tab: "layouts" | "catalog"
  onTabChange?: (t: "layouts" | "catalog") => void
  templates: HomeTemplate[]
  activeTemplateId: string
  onSelectTemplate?: (id: string) => void
  onNewTemplate?: () => void
  roleOptions?: { value: string; label: string }[]
  positionOptions?: { value: string; label: string }[]
  widgets: HomeWidgetSlot[]
  onToggleRequired?: (id: string, v: boolean) => void
  onToggleFullWidth?: (id: string) => void
  onAddWidget?: () => void
  onPreview?: () => void
  onDelete?: () => void
  onSave?: () => void
  onApplyAll?: () => void
  /** Move a widget into a zone, before `beforeId` (or to the end when null). Fired by drag-and-drop and keyboard reordering. */
  onMoveWidget?: (id: string, zone: HomeWidgetZone, beforeId: string | null) => void
  onRemoveWidget?: (id: string) => void
  catalog?: HomeCatalogWidget[]
  onToggleCatalog?: (id: string, enabled: boolean) => void
  onAddToTemplate?: (id: string) => void
}

interface DndApi { dragId: string | null; setDragId: (id: string | null) => void; move: (id: string, zone: HomeWidgetZone, before: string | null) => void; announce: (m: string) => void; zones: Record<HomeWidgetZone, HomeWidgetSlot[]> }

function WidgetCard({ w, dnd, onRequired, onFull, onRemove }: { w: HomeWidgetSlot; dnd: DndApi; onRequired?: HomeLayoutAdminPageProps["onToggleRequired"]; onFull?: HomeLayoutAdminPageProps["onToggleFullWidth"]; onRemove?: (id: string) => void }) {
  const zone = zoneOf(w)
  const list = dnd.zones[zone]
  const idx = list.findIndex((x) => x.id === w.id)
  const onKey = (e: React.KeyboardEvent) => {
    const key = e.key
    if (key === "ArrowUp" && idx > 0) { e.preventDefault(); dnd.move(w.id, zone, list[idx - 1]!.id); dnd.announce(`${w.title}: vị trí ${idx} trong ${list.length}`) }
    else if (key === "ArrowDown" && idx < list.length - 1) { e.preventDefault(); dnd.move(w.id, zone, list[idx + 2]?.id ?? null); dnd.announce(`${w.title}: vị trí ${idx + 2} trong ${list.length}`) }
    else if (key === "ArrowLeft" && zone === "side") { e.preventDefault(); dnd.move(w.id, "main", null); dnd.announce(`${w.title}: chuyển sang cột chính`) }
    else if (key === "ArrowRight" && zone === "main") { e.preventDefault(); dnd.move(w.id, "side", null); dnd.announce(`${w.title}: chuyển sang cột phụ`) }
  }
  return (
    <div
      data-testid={`widget-${w.id}`}
      draggable
      onDragStart={(e) => { dnd.setDragId(w.id); e.dataTransfer?.setData("text/plain", w.id); if (e.dataTransfer) e.dataTransfer.effectAllowed = "move" }}
      onDragEnd={() => dnd.setDragId(null)}
      onDragOver={(e) => { if (dnd.dragId && dnd.dragId !== w.id) e.preventDefault() }}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (dnd.dragId && dnd.dragId !== w.id) dnd.move(dnd.dragId, zone, w.id); dnd.setDragId(null) }}
      className={cn("relative min-w-0 rounded-[14px] border border-border bg-card shadow-[0_1px_2px_#0b2e4a0d,0_4px_16px_#0b2e4a0f] outline-[1.5px] outline-offset-[3px] outline-border-strong outline-dashed hover:outline-ring", dnd.dragId === w.id && "opacity-40")}
    >
      <div className="flex min-h-[38px] items-center gap-2 rounded-t-[14px] border-b border-dashed border-border-strong bg-secondary py-1 pr-1.5 pl-1 text-small">
        <button type="button" onKeyDown={onKey} aria-label={`Sắp xếp ${w.title}: dùng phím mũi tên`} aria-describedby="hl-dnd-help" title="Kéo để di chuyển · Space để nhấc bằng bàn phím" className="grid size-[30px] flex-none cursor-grab place-items-center rounded-[7px] border-0 bg-transparent text-title leading-none text-subtle-foreground outline-none hover:bg-[#e9eef3] hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring active:cursor-grabbing"><span aria-hidden>⠿</span></button>
        <span className="min-w-0 truncate font-semibold text-foreground">{w.title}</span>
        {w.column === "main" && <button type="button" aria-pressed={!!w.fullWidth} title="Thu còn nửa bề ngang — đứng cạnh ô nửa liền trước/sau" onClick={() => onFull?.(w.id)} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border-strong bg-card px-2 py-px text-label leading-5 font-semibold whitespace-nowrap text-muted-foreground hover:border-primary hover:text-primary aria-pressed:border-primary aria-pressed:text-primary"><FoldHorizontal aria-hidden className="size-[13px] flex-none" />Rộng đầy</button>}
        <label title="Chèn vào cả bố cục riêng của mọi người, không ẩn được" className="m-0 inline-flex cursor-pointer items-center gap-[5px] rounded-md border border-[#efd9ac] bg-warning/10 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-[#8a5d0b]"><Checkbox className="size-3.5" checked={!!w.required} onCheckedChange={(c) => onRequired?.(w.id, c === true)} aria-label={`Bắt buộc: ${w.title}`} />Bắt buộc</label>
        <span className="flex-1" />
        <DropdownMenu><DropdownMenuTrigger asChild><button type="button" aria-label={`Tuỳ chọn ${w.title}`} title={`Thao tác với ${w.title}`} className="grid size-[30px] cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-title leading-none text-subtle-foreground outline-none hover:bg-secondary hover:text-foreground data-[state=open]:bg-secondary">⋯</button></DropdownMenuTrigger><DropdownMenuContent align="end">
          <DropdownMenuItem disabled={idx <= 0} onSelect={() => dnd.move(w.id, zone, list[idx - 1]!.id)}>Đưa lên</DropdownMenuItem>
          <DropdownMenuItem disabled={idx >= list.length - 1} onSelect={() => dnd.move(w.id, zone, list[idx + 2]?.id ?? null)}>Đưa xuống</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRemove?.(w.id)}>Gỡ widget</DropdownMenuItem>
        </DropdownMenuContent></DropdownMenu>
      </div>
      <div inert className="pointer-events-none px-[18px] py-4 text-small text-subtle-foreground opacity-[.92] select-none">{w.body ?? "Nội dung widget"}</div>
    </div>
  )
}

function DropZone({ zone, dnd, className, children, empty }: { zone: HomeWidgetZone; dnd: DndApi; className?: string; children: React.ReactNode; empty?: React.ReactNode }) {
  const [over, setOver] = React.useState(false)
  return (
    <div
      data-testid={`zone-${zone}`}
      onDragOver={(e) => { if (dnd.dragId) { e.preventDefault(); setOver(true) } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); if (dnd.dragId) dnd.move(dnd.dragId, zone, null); dnd.setDragId(null) }}
      className={cn("rounded-2xl", over && "ring-2 ring-primary/40", className)}
    >{children}{empty}</div>
  )
}

function CatalogTab({ catalog, onToggle, onAdd }: { catalog: HomeCatalogWidget[]; onToggle?: HomeLayoutAdminPageProps["onToggleCatalog"]; onAdd?: HomeLayoutAdminPageProps["onAddToTemplate"] }) {
  const zoneLabel: Record<HomeWidgetZone, string> = { full: "Đầu trang", main: "Cột chính", side: "Cột phụ" }
  return (
    <section aria-label="Danh mục widget" className="rounded-lg border bg-card">
      <div className="border-b p-4"><h3 className="font-bold">Danh mục widget <Badge variant="secondary">{catalog.length}</Badge></h3><p className="text-sm text-muted-foreground">Widget toàn hệ. Widget bị tắt sẽ không xuất hiện trong mọi bố cục.</p></div>
      <div className="relative overflow-x-auto"><table className="w-full min-w-[40rem] text-sm">
        <thead className="border-b bg-secondary"><tr>{["Widget", "Vị trí mặc định", "Hiển thị cho", "Bật", ""].map((h, i) => <th key={i} className="h-10 px-3.5 text-left text-caption font-bold tracking-wider text-muted-foreground uppercase">{h || <span className="sr-only">Thao tác</span>}</th>)}</tr></thead>
        <tbody>
          {catalog.map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="px-3.5 py-2.5"><div className="font-semibold">{c.title}</div><div className="text-xs text-muted-foreground">{c.description}</div></td>
              <td className="px-3.5">{zoneLabel[c.defaultZone]}</td>
              <td className="px-3.5 text-muted-foreground">{c.roles}</td>
              <td className="px-3.5"><Switch checked={c.enabled} onCheckedChange={(v) => onToggle?.(c.id, v)} aria-label={`Bật widget ${c.title}`} /></td>
              <td className="px-3.5 text-right"><Button size="sm" variant="outline" disabled={!c.enabled || c.inTemplate} onClick={() => onAdd?.(c.id)}>{c.inTemplate ? "Đã có trong mẫu" : "Thêm vào mẫu"}</Button></td>
            </tr>
          ))}
        </tbody>
      </table></div>
    </section>
  )
}

/** Admin editor for the home-page widget layout templates. */
export function HomeLayoutAdminPage({ tab, onTabChange, templates, activeTemplateId, onSelectTemplate, onNewTemplate, roleOptions = [], positionOptions = [], widgets, onToggleRequired, onToggleFullWidth, onAddWidget, onPreview, onDelete, onSave, onApplyAll, onMoveWidget, onRemoveWidget, catalog = [], onToggleCatalog, onAddToTemplate }: HomeLayoutAdminPageProps) {
  const active = templates.find((t) => t.id === activeTemplateId) ?? templates[0]
  const [name, setName] = React.useState(active?.name ?? "")
  const required = widgets.filter((w) => w.required).length
  const zones: Record<HomeWidgetZone, HomeWidgetSlot[]> = { full: widgets.filter((w) => zoneOf(w) === "full"), main: widgets.filter((w) => zoneOf(w) === "main"), side: widgets.filter((w) => zoneOf(w) === "side") }
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [live, setLive] = React.useState("")
  const dnd: DndApi = { dragId, setDragId, zones, announce: setLive, move: (id, zone, before) => { onMoveWidget?.(id, zone, before) } }
  const [roles, setRoles] = React.useState("")
  const [positions, setPositions] = React.useState("")
  const [isDefault, setIsDefault] = React.useState(!!active?.isDefault)
  const field = "grid content-start gap-1"
  const lab = "text-small leading-[1.4] font-semibold text-foreground"
  const bar = "h-9 px-3 text-control"
  return (
    <div className="flex h-full min-h-0 flex-col overflow-auto pb-6">
      <div className="mb-4 flex flex-wrap items-center gap-3.5">
        <AdminSegmented variant="solid" label="Chế độ" value={tab} onChange={onTabChange} options={[{ value: "layouts", label: "Bố cục mẫu" }, { value: "catalog", label: "Danh mục widget" }]} />
        <span className="text-small text-subtle-foreground">Trang chủ dạng widget: bố cục mẫu theo vai trò/chức vụ và danh mục widget toàn hệ.</span>
      </div>
      <p id="hl-dnd-help" className="sr-only">Kéo thả để đổi vị trí. Bằng bàn phím: mũi tên lên xuống để đổi thứ tự, trái phải để chuyển cột.</p>
      <div role="status" aria-live="polite" className="sr-only">{live}</div>
      {tab === "catalog" ? <CatalogTab catalog={catalog} onToggle={onToggleCatalog} onAdd={onAddToTemplate} /> : (
      <div className="grid items-start gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-2 lg:sticky lg:top-0">
          <div className="mb-1 flex items-center justify-between"><b className="text-sm">Bố cục mẫu</b><Button variant="outline" size="sm" className="text-small [&_svg]:size-4" onClick={onNewTemplate}><Plus />Mẫu mới</Button></div>
          {templates.map((t) => (
            <button key={t.id} type="button" aria-pressed={t.id === activeTemplateId} onClick={() => onSelectTemplate?.(t.id)} className={cn("flex w-full cursor-pointer flex-col gap-[3px] rounded-xl border bg-card px-3 py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring", t.id === activeTemplateId ? "border-primary shadow-[0_0_0_2px_rgba(0,86,140,.12)]" : "border-border hover:border-[#b9d2f0]")}>
              <span className="flex flex-wrap items-center gap-1.5 text-control font-semibold">{t.name}{t.isDefault && <Badge variant="success" className="origin-left scale-90">Mặc định</Badge>}</span>
              <span className="text-xs text-subtle-foreground">{t.description}</span><span className="text-xs text-subtle-foreground">Ưu tiên {t.priority} · {t.recipients} người nhận</span>
            </button>
          ))}
          <p className="mx-0.5 mt-1 mb-0 text-xs leading-normal text-subtle-foreground">Người dùng khớp nhiều mẫu thì mẫu có số ưu tiên <b>nhỏ nhất</b> thắng; không khớp mẫu nào thì nhận mẫu mặc định.</p>
        </aside>
        <section className="min-w-0">
          <div className="mb-3 grid items-end gap-3 rounded-xl border border-border bg-card px-4 py-3.5 max-[1199px]:grid-cols-2 min-[1200px]:grid-cols-[1.1fr_1.4fr_1.4fr_90px_auto]">
            <div className={field}><Label htmlFor="hl-name" className={lab}>Tên mẫu</Label><Input id="hl-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className={field}><Label className={lab}>Áp dụng cho vai trò</Label>
              <Select value={roles} onValueChange={setRoles}><SelectTrigger aria-label="Áp dụng cho vai trò"><SelectValue placeholder="Chọn vai trò" /></SelectTrigger><SelectContent>{roleOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            <div className={field}><Label className={lab}>… hoặc chức vụ</Label>
              <Select value={positions} onValueChange={setPositions}><SelectTrigger aria-label="Chức vụ"><SelectValue placeholder="Chọn chức vụ" /></SelectTrigger><SelectContent>{positionOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select></div>
            <div className={field}><Label htmlFor="hl-pri" className={lab}>Ưu tiên</Label><Input id="hl-pri" type="number" defaultValue={active?.priority} /></div>
            <div className="flex items-center gap-2 pb-1"><Checkbox id="hl-def" checked={isDefault} onCheckedChange={(c) => setIsDefault(c === true)} /><Label htmlFor="hl-def" className="grid gap-0 font-normal"><span className="text-control font-semibold">Mẫu mặc định</span><span className="text-xs text-subtle-foreground">Cho người không khớp mẫu nào</span></Label></div>
          </div>
          <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-[#f1f6fd] px-3 py-2.5 shadow-[0_6px_18px_rgba(11,46,74,.08)]">
            <span className="min-w-[180px] flex-1 text-body text-muted-foreground"><b>{widgets.length}</b> widget · <b>{required}</b> bắt buộc</span>
            <Button variant="outline" size="toolbar" className={bar} onClick={onAddWidget}><Plus />Thêm widget</Button>
            <Button variant="outline" size="toolbar" className={bar} onClick={onPreview}>Xem thử như…</Button>
            <Button variant="ghost" size="toolbar" className={cn(bar, "text-muted-foreground")} disabled={!!active?.isDefault} title={active?.isDefault ? "Không xóa được mẫu mặc định" : undefined} onClick={onDelete}>Xóa mẫu</Button>
            <Button variant="outline" size="toolbar" className={bar} onClick={onSave}>Lưu mẫu</Button>
            <Button size="toolbar" className={bar} onClick={onApplyAll}>Áp dụng cho tất cả…</Button>
          </div>
          <p className="mx-0.5 mt-0 mb-4 text-xs leading-normal text-subtle-foreground"><b>Lưu mẫu</b>: chỉ người đang dùng mẫu thấy thay đổi. Ô <b>Bắt buộc</b> được chèn vào cả bố cục riêng của mọi người và không ẩn được. Widget hiện dữ liệu của chính bạn; khối bạn không có quyền xem hiện khung giữ chỗ.</p>
          <div className="flex flex-col gap-7">
            <DropZone zone="full" dnd={dnd} className="-m-2 grid gap-4 p-2" empty={null}>
              {zones.full.map((w) => <WidgetCard key={w.id} w={w} dnd={dnd} onRequired={onToggleRequired} onFull={onToggleFullWidth} onRemove={onRemoveWidget} />)}
              <p className="m-0 rounded-xl border-[1.5px] border-dashed border-[#bee3df] bg-[#f5fbfa] p-3 text-center text-small text-[#10705c]">Đầu trang — thả widget vào đây để rộng toàn màn hình, trên cả hai cột</p>
            </DropZone>
            <div className="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_300px]">
              <DropZone zone="main" dnd={dnd} className="-m-2 grid min-h-16 content-start gap-4 p-2">{zones.main.map((w) => <WidgetCard key={w.id} w={w} dnd={dnd} onRequired={onToggleRequired} onFull={onToggleFullWidth} onRemove={onRemoveWidget} />)}</DropZone>
              <DropZone zone="side" dnd={dnd} className="-m-2 grid min-h-16 content-start gap-4 p-2">{zones.side.map((w) => <WidgetCard key={w.id} w={w} dnd={dnd} onRequired={onToggleRequired} onFull={onToggleFullWidth} onRemove={onRemoveWidget} />)}</DropZone>
            </div>
          </div>
        </section>
      </div>
      )}
    </div>
  )
}
