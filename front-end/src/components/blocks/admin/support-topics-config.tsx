"use client"

// @dthu/ui 0.2.0 · block-admin
import * as React from "react"
import { Plus, TriangleAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { tableSoftBorder } from "@/components/ui/table"
import { AdminGrid as Grid, AdminPanel as Panel, adminCell as td, adminMono as mono } from "./parts"

export interface SupportTopic { id: string; code: string; name: string; description: string; defaultFor?: "bug" | "feedback"; appliesTo: string; defaultPriority: string; group?: string; suggestedPages: string[]; openCount: number; enabled: boolean }
export interface SupportReplyTemplate { id: string; title: string; shortcut: string; topic: string; content: string; used: number }
export interface SupportHoursRow { level: string; firstResponse: string; resolve: string }

export interface SupportTopicsConfigProps {
  topics: SupportTopic[]
  onAdd?: () => void
  onEdit?: (t: SupportTopic) => void
  onToggle?: (t: SupportTopic) => void
  onDelete?: (t: SupportTopic) => void
  /** "Mẫu trả lời" panel; omitted = panel hidden. */
  templates?: SupportReplyTemplate[]
  onAddTemplate?: () => void
  /** "Hạn & giờ làm việc" panel (read-only): level targets + key/value settings. */
  hours?: { rows: SupportHoursRow[]; settings: [string, React.ReactNode][] }
  /** "Sự cố chung" panel: number of incidents being fixed. */
  activeIncidents?: number
  onOpenIncidents?: () => void
}

function RowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button type="button" aria-label={label} title="Thao tác khác" onClick={(e) => e.stopPropagation()} className="grid size-[30px] cursor-pointer place-items-center rounded-md border-0 bg-transparent p-0 text-title leading-none text-subtle-foreground outline-none hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary data-[state=open]:bg-secondary">⋯</button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Topics and handling groups configuration for support requests (reference `ch-trang`: stacked `do-khoi` panels). */
export function SupportTopicsConfig({ topics, onAdd, onEdit, onToggle, onDelete, templates, onAddTemplate, hours, activeIncidents, onOpenIncidents }: SupportTopicsConfigProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto pb-4">
      <Panel title="Chủ đề & nhóm xử lý" count={topics.length} description="Người gửi chọn chủ đề; phiếu đi tới nhóm xử lý của chủ đề đó. Chủ đề đã có phiếu thì chỉ tắt được, không xoá." action={<Button size="sm" className="h-[30px] px-2.5 text-small [&_svg]:size-4" onClick={onAdd}><Plus />Thêm chủ đề</Button>}>
        <Grid label="Chủ đề & nhóm xử lý" minWidth={1237} cols={[undefined, 170, 130, 240, 200, 96, 90, 51]} head={["Chủ đề", "Áp dụng", "Mức mặc định", "Nhóm xử lý", "Trang gợi ý", <span key="o" className="block text-right">Đang mở</span>, "Bật", ""]}>
          {topics.map((t) => (
            <tr key={t.id} className="group/row cursor-pointer" onClick={() => onEdit?.(t)}>
              <td className={td}>
                <span className="flex min-w-0 items-baseline gap-[9px]">
                  <span className={cn("text-body leading-[1.3] font-semibold tracking-[-0.01em] whitespace-nowrap text-primary", mono)}>{t.code}</span>
                  <span className="block truncate text-sm leading-[1.35] font-[550] tracking-[-0.005em] text-foreground">{t.name}</span>
                  {t.defaultFor && <span className="flex-none rounded-[3px] border border-[#ebd7b4] bg-[#fbf2e3] px-1.5 py-px text-micro font-bold tracking-[0.02em] whitespace-nowrap text-warning uppercase">{t.defaultFor === "bug" ? "Mặc định báo lỗi" : "Mặc định góp ý"}</span>}
                </span>
                <span className="mt-0.5 block truncate text-label leading-[1.35] text-subtle-foreground">{t.description}</span>
                {!t.group && <span className="mt-0.5 block text-xs text-warning"><TriangleAlert aria-hidden className="mr-1 inline size-3.5 align-[-2px]" />Chưa khai nhóm — phiếu đi tới mọi người có quyền xử lý hỗ trợ.</span>}
              </td>
              <td className={td}><span className="block truncate">{t.appliesTo}</span></td>
              <td className={td}>{t.defaultPriority}</td>
              <td className={td}>{t.group ?? <span className="text-subtle-foreground">Chưa khai nhóm</span>}</td>
              <td className={td}>{t.suggestedPages.length === 0 ? <span className="text-subtle-foreground">—</span> : <span className="flex min-w-0 items-center gap-1.5" title={t.suggestedPages.join("\n")}><code className={cn("truncate bg-transparent p-0 text-xs text-foreground", mono)}>{t.suggestedPages[0]}</code>{t.suggestedPages.length > 1 && <span className="text-subtle-foreground">+{t.suggestedPages.length - 1}</span>}</span>}</td>
              <td className={cn(td, "text-right")}><span className="text-xs tabular-nums">{t.openCount}</span></td>
              <td className={td}><Badge variant={t.enabled ? "success" : "secondary"}>{t.enabled ? "Bật" : "Tắt"}</Badge></td>
              <td className={cn(td, "text-center")}>
                <RowMenu label={`Thao tác với ${t.name}`}>
                  <DropdownMenuItem onSelect={() => onEdit?.(t)}>Chỉnh sửa</DropdownMenuItem><DropdownMenuItem onSelect={() => onToggle?.(t)}>{t.enabled ? "Tắt" : "Bật"}</DropdownMenuItem><DropdownMenuItem variant="destructive" disabled={t.openCount > 0} onSelect={() => onDelete?.(t)}>Xoá</DropdownMenuItem>
                </RowMenu>
              </td>
            </tr>
          ))}
        </Grid>
      </Panel>
      {templates && (
        <Panel title="Mẫu trả lời" count={templates.length} description="Bên hỗ trợ gõ “/” + phím tắt trong ô trả lời để chèn. Biến {hoTen}, {maPhieu} được thay khi chèn." action={<Button variant="outline" size="sm" className="h-[30px] px-2.5 text-small [&_svg]:size-4" onClick={onAddTemplate}><Plus />Thêm mẫu</Button>}>
          <Grid label="Mẫu trả lời" minWidth={1007} cols={[undefined, 170, 190, undefined, 96, 51]} head={["Mẫu", "Phím tắt", "Chủ đề", "Nội dung", <span key="u" className="block text-right">Đã dùng</span>, ""]}>
            {templates.map((t) => (
              <tr key={t.id} className="group/row">
                <td className={td}><span className="block truncate text-sm leading-[1.35] font-[550] tracking-[-0.005em]">{t.title}</span></td>
                <td className={td}><code className={cn("bg-transparent p-0 text-xs font-semibold text-primary", mono)}>/{t.shortcut}</code></td>
                <td className={td}>{t.topic}</td>
                <td className={td}><span className="block truncate text-muted-foreground">{t.content}</span></td>
                <td className={cn(td, "text-right")}><span className="text-xs tabular-nums">{t.used}</span></td>
                <td className={cn(td, "text-center")}><RowMenu label={`Thao tác với ${t.title}`}><DropdownMenuItem>Chỉnh sửa</DropdownMenuItem></RowMenu></td>
              </tr>
            ))}
          </Grid>
        </Panel>
      )}
      {(hours || activeIncidents !== undefined) && (
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {hours && (
            <Panel title="Hạn & giờ làm việc" description="Hạn tính bằng giờ làm việc. Chỉ đọc — sửa ở mục HoTroSettings trong appsettings.json của máy chủ.">
              <table className="mb-3 w-full border-collapse text-body">
                <thead><tr>{["Mức", "Phản hồi đầu", "Giải quyết"].map((h) => <th key={h} className="border-b px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground">{h}</th>)}</tr></thead>
                <tbody>{hours.rows.map((r) => <tr key={r.level}><td className={cn("border-b px-2 py-1.5 tabular-nums", tableSoftBorder)}>{r.level}</td><td className={cn("border-b px-2 py-1.5 tabular-nums", tableSoftBorder)}>{r.firstResponse}</td><td className={cn("border-b px-2 py-1.5 tabular-nums", tableSoftBorder)}>{r.resolve}</td></tr>)}</tbody>
              </table>
              <dl className="m-0 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-body">{hours.settings.map(([k, v]) => <React.Fragment key={k}><dt className="font-semibold text-muted-foreground">{k}</dt><dd className="m-0">{v}</dd></React.Fragment>)}</dl>
            </Panel>
          )}
          {activeIncidents !== undefined && (
            <Panel title="Sự cố chung" description="Lỗi diện rộng: gom phiếu, hiện banner cho người dùng, trả lời một lần.">
              <div className="mb-2.5 flex items-baseline gap-2 text-control"><span className="text-[28px] leading-none font-bold text-muted-foreground">{activeIncidents}</span><span>sự cố đang khắc phục</span></div>
              <button type="button" onClick={onOpenIncidents} className="cursor-pointer border-0 bg-transparent p-0 text-body font-semibold text-primary hover:underline">Mở trang Sự cố chung →</button>
            </Panel>
          )}
        </div>
      )}
    </div>
  )
}
