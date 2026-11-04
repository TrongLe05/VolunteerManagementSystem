"use client"

// @dthu/ui 0.2.0 · block-dashboard
import * as React from "react"
import { cn } from "@/lib/utils"
import { bdShadow, bdTokens } from "./tokens"

export interface StatCardProps {
  label: string
  value: React.ReactNode
  /** Unit shown next to the value, e.g. "ngày". */
  unit?: string
  description?: React.ReactNode
  /** Mono reference line (e.g. a document code). */
  reference?: string
  /** Highlighted card uses the rose tone. */
  highlight?: boolean
  onClick?: () => void
  className?: string
}

/** Reference `dcs__o`: radius 14, padding 15/16/14, label 11.5/600, number 34/700, caption 11.5. */
export function StatCard({ label, value, unit, description, reference, highlight, onClick, className }: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-highlight={highlight ? "true" : undefined}
      className={cn(
        bdTokens, bdShadow,
        "flex w-full cursor-pointer flex-col items-start rounded-[14px] border border-(--bd-ke) bg-(--bd-mat) px-4 pt-[15px] pb-3.5 text-left font-[inherit] text-inherit outline-none hover:border-(--bd-ke-2) focus-visible:ring-2 focus-visible:ring-ring",
        highlight && "border-(--bd-gap-line) bg-[linear-gradient(180deg,var(--bd-gap),var(--bd-mat)_60%)] hover:border-(--bd-t1)",
        className,
      )}
    >
      <span className="text-label font-semibold text-(--bd-chu-3)">{label}</span>
      <span className={cn("mt-1.5 text-display leading-[1.05] font-bold tracking-[-0.035em] tabular-nums", highlight ? "text-(--bd-t4)" : "text-foreground")}>
        {value}{unit ? <small className="ml-[3px] text-sm font-medium tracking-normal text-(--bd-chu-3)">{unit}</small> : null}
      </span>
      {reference ? <span className="mt-[3px] max-w-full truncate font-mono text-caption text-(--bd-chu-3)">{reference}</span> : null}
      {description ? <span className="mt-[3px] max-w-full truncate text-label text-(--bd-chu-3)">{description}</span> : null}
    </button>
  )
}
