"use client"

// @dthu/ui 0.2.0 · block-dashboard
import * as React from "react"
import { cn } from "@/lib/utils"
import { bdTokens } from "./tokens"

export type LineChartTone = "primary" | "warning" | "success" | "destructive"
export interface LineChartSeries { id: string; label: string; values: number[]; tone?: LineChartTone }
export interface LineChartProps {
  labels: string[]
  series: LineChartSeries[]
  /** Y axis tick values; defaults to 0, 30%, 50%, 80% and 100% of a "nice" maximum (at least 10). */
  yTicks?: number[]
  /** Height of the SVG viewBox (the width is fixed at 720 and the SVG scales to its container). */
  height?: number
  /** Accessible description of the chart. */
  ariaLabel?: string
  tableToggleLabel?: string
  chartToggleLabel?: string
  firstColumnLabel?: string
  className?: string
}

/** Colours of the reference chart (`--bd-s1` blue, `--bd-s2` orange, `--bd-la` green, `--bd-t3` rose). */
const toneColor: Record<LineChartTone, string> = { primary: "var(--bd-s1)", warning: "var(--bd-s2)", success: "#10705c", destructive: "var(--bd-t3)" }
const defaultTones: LineChartTone[] = ["primary", "warning", "success", "destructive"]

const W = 720, padL = 40, padR = 14, padT = 12, padB = 28
const niceMax = (v: number) => {
  if (v <= 10) return 10
  const p = 10 ** Math.floor(Math.log10(v))
  return [1, 2, 5, 10].map((m) => m * p).find((m) => m >= v) ?? v
}

/** Hand-rolled SVG line chart (reference `bxh`): legend, scaled SVG with mono axis labels, hover tooltip and a table disclosure. */
export function LineChart({ labels, series, yTicks, height = 200, ariaLabel = "Biểu đồ đường", tableToggleLabel = "Xem dạng bảng", chartToggleLabel = "Ẩn dạng bảng", firstColumnLabel = "Tháng", className }: LineChartProps) {
  const [asTable, setAsTable] = React.useState(false)
  const [hover, setHover] = React.useState<number | null>(null)
  const tableId = React.useId()

  const max = Math.max(0, ...series.flatMap((s) => s.values))
  const top = yTicks?.length ? Math.max(...yTicks, 1) : niceMax(max)
  const ticks = yTicks ?? [...new Set([0, 0.3, 0.5, 0.8, 1].map((f) => Math.round(top * f)))]
  const innerW = W - padL - padR, innerH = height - padT - padB
  const x = (i: number) => padL + (labels.length <= 1 ? innerW / 2 : (i * innerW) / (labels.length - 1))
  const y = (v: number) => padT + innerH - (v / top) * innerH
  const toneOf = (s: LineChartSeries, i: number) => s.tone ?? defaultTones[i % defaultTones.length]!
  const colorOf = (s: LineChartSeries, i: number) => toneColor[toneOf(s, i)]

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / Math.max(rect.width, 1)) * W
    const idx = Math.round(((px - padL) / Math.max(innerW, 1)) * (labels.length - 1))
    setHover(Math.min(labels.length - 1, Math.max(0, idx)))
  }
  const tipLeftPct = hover === null ? 0 : (x(hover) / W) * 100

  return (
    <div className={cn(bdTokens, "flex flex-col text-[length:inherit]", className)}>
      <ul className="m-0 mb-3 flex list-none flex-wrap gap-x-[18px] gap-y-1 p-0 text-small text-(--bd-chu-2)">
        {series.map((s, i) => (
          <li key={s.id} className="flex items-center gap-[7px]"><span aria-hidden className="size-[11px] shrink-0 rounded-[3px]" style={{ background: colorOf(s, i) }} />{s.label}</li>
        ))}
      </ul>
      <div className="relative">
        <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${W} ${height}`} className="block h-auto w-full overflow-visible" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <g>
            {ticks.map((t) => (
              <React.Fragment key={t}>
                <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--bd-ke)" strokeWidth={1} />
                <text x={padL - 9} y={y(t) + 4} textAnchor="end" className="fill-(--bd-mo) font-mono text-tiny">{t}</text>
              </React.Fragment>
            ))}
          </g>
          {labels.map((l, i) => (
            <text key={l + i} x={x(i)} y={height - 8} textAnchor="middle" className="fill-(--bd-mo) font-mono text-tiny">{l}</text>
          ))}
          {hover !== null && <line data-testid="chart-crosshair" x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + innerH} stroke="var(--bd-ke-2)" strokeWidth={1} />}
          {series[0] && series[0].values.length > 1 && (
            <path d={`${series[0].values.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ")} L${x(series[0].values.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`} fill={colorOf(series[0], 0)} opacity={0.07} />
          )}
          {[...series].reverse().map((s, ri) => {
            const si = series.length - 1 - ri
            return <path key={s.id} d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join(" ")} fill="none" stroke={colorOf(s, si)} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          })}
          {[...series].reverse().map((s, ri) => {
            const si = series.length - 1 - ri
            const at = hover ?? s.values.length - 1
            return s.values[at] === undefined ? null : <circle key={s.id} cx={x(at)} cy={y(s.values[at]!)} r={4.5} fill={colorOf(s, si)} stroke="var(--card)" strokeWidth={2} />
          })}
        </svg>
        {hover !== null && (
          <div role="tooltip" className="pointer-events-none absolute top-2 z-10 min-w-28 rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md" style={{ left: `${tipLeftPct}%`, transform: tipLeftPct > 60 ? "translateX(calc(-100% - 10px))" : "translateX(10px)" }}>
            <div className="mb-1 font-mono font-semibold">{labels[hover]}</div>
            {series.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between gap-3"><span className="flex items-center gap-1.5"><span aria-hidden className="size-2 rounded-[2px]" style={{ background: colorOf(s, i) }} />{s.label}</span><b className="tabular-nums">{s.values[hover] ?? 0}</b></div>
            ))}
          </div>
        )}
      </div>
      <div className="mt-3.5">
        <button type="button" aria-expanded={asTable} aria-controls={tableId} onClick={() => setAsTable((v) => !v)} className="flex w-full cursor-pointer items-center gap-1.5 rounded border-0 bg-transparent p-0 text-small font-semibold text-(--bd-s1) outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span aria-hidden className={cn("mr-[3px] size-0 border-y-[4px] border-l-[7px] border-y-transparent border-l-current transition-transform", asTable && "rotate-90")} />{asTable ? chartToggleLabel : tableToggleLabel}
        </button>
        {asTable && (
          <table id={tableId} aria-label={ariaLabel} className="mt-2.5 w-full border-collapse text-left text-small">
            <thead><tr><th scope="col" className="border-b border-(--bd-ke) px-2.5 py-1.5 text-caption font-semibold tracking-[0.08em] text-(--bd-chu-3) uppercase">{firstColumnLabel}</th>{series.map((s) => <th scope="col" key={s.id} className="border-b border-(--bd-ke) px-2.5 py-1.5 text-caption font-semibold tracking-[0.08em] text-(--bd-chu-3) uppercase">{s.label}</th>)}</tr></thead>
            <tbody>{labels.map((l, i) => <tr key={l + i}><th scope="row" className="border-b border-(--bd-ke) px-2.5 py-1.5 font-normal">{l}</th>{series.map((s) => <td key={s.id} className="border-b border-(--bd-ke) px-2.5 py-1.5 text-right font-mono tabular-nums">{s.values[i] ?? 0}</td>)}</tr>)}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}
