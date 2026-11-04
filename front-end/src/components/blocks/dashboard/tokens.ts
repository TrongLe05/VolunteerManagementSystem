// @dthu/ui 0.2.0 · block-dashboard
/**
 * Dashboard palette (reference `.bd-mau`): scoped CSS variables so every dashboard block renders the same when used alone.
 * chu = ink, chu-2/chu-3 = softer inks, mo = faint, mat/mat-2 = surfaces, ke/ke-2 = soft lines, s1/s2 = chart blue/orange,
 * t1..t4 = rose scale of the highlighted stat card. Dark values are tuned for the dark tokens. Every ink (chu, chu-2, chu-3, mo) is text, so scripts/check-contrast.mjs requires 4.5:1 on each surface.
 */
export const bdTokens =
  "[--bd-chu:#0b2e4a] [--bd-chu-2:#3e5468] [--bd-chu-3:#566a7c] [--bd-mo:#5f7284] [--bd-mat:var(--card)] [--bd-mat-2:#f7f9fb] [--bd-ke:#e3e9ef] [--bd-ke-2:#cfd8e1] [--bd-s1:#2570c9] [--bd-s2:#eb6834] [--bd-t1:#eb9ab6] [--bd-t3:#c8386b] [--bd-t4:#9e2751] [--bd-now:#fdf5f8] [--bd-gap:#fef6f9] [--bd-gap-line:#f3c9d6] " +
  "dark:[--bd-chu:#e6edf3] dark:[--bd-chu-2:#b7c4d0] dark:[--bd-chu-3:#8d9eae] dark:[--bd-mo:#8797a7] dark:[--bd-mat-2:#1b2733] dark:[--bd-ke:#2a3846] dark:[--bd-ke-2:#3d4f61] dark:[--bd-s1:#5aa2f0] dark:[--bd-s2:#f08a5d] dark:[--bd-t1:#8a3f5c] dark:[--bd-t3:#e57fa3] dark:[--bd-t4:#f08fb2] dark:[--bd-now:#2a1c25] dark:[--bd-gap:#2a1c25] dark:[--bd-gap-line:#5b2f43]"

export const bdShadow = "shadow-[0_1px_2px_#0b2e4a0d,0_4px_16px_#0b2e4a0f]"
