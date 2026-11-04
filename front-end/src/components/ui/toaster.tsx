import { Toaster as Sonner, toast } from "sonner"

/*
 * Reference toast (sonner skinned by the reference app): 380px wide, radius 10, 1px border, padding 12 36 14 12, gap 12, 13.5px;
 * 32px tinted icon tile (radius 8) coloured by type (info = primary, success, error, warning); title 600, description 12.5px
 * muted; action link 12.5/700 primary; close button appears on hover; 2px countdown bar along the bottom edge.
 */
const CSS = `
[data-sonner-toaster][data-sonner-theme] { --normal-bg: var(--background); --normal-bg-hover: var(--background); --normal-border: var(--border); --normal-border-hover: var(--input); --normal-text: var(--foreground); --border-radius: 10px; --width: 380px; font-family: inherit; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] { --tc: var(--primary); background-image: linear-gradient(var(--tc), var(--tc)); background-position: 0 100%; background-repeat: no-repeat; background-size: 0 2px; align-items: flex-start; gap: 12px; padding: 12px 36px 14px 12px; font-size: 13.5px; box-shadow: 0 8px 24px rgba(16,28,44,.12), 0 1px 3px rgba(16,28,44,.08); }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"][data-type="success"] { --tc: var(--success); }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"][data-type="error"] { --tc: var(--destructive); }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"][data-type="warning"] { --tc: var(--warning); }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"][style*="--d"] { animation: dt-toast-dem var(--d) linear forwards; }
@keyframes dt-toast-dem { from { background-size: 0 2px; } to { background-size: 100% 2px; } }
[data-sonner-toaster]:hover [data-sonner-toast][data-styled="true"] { animation-play-state: paused; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-icon] { width: 32px; height: 32px; color: var(--tc); background: color-mix(in srgb, var(--tc) 12%, var(--background)); border-radius: 8px; justify-content: center; margin: 0; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-icon] > svg { width: 17px; height: 17px; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-content] { gap: 2px; min-width: 0; padding-top: 1px; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-title] { font-weight: 600; line-height: 1.4; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-description] { color: var(--muted-foreground); font-size: 12.5px; line-height: 1.45; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-button][data-action] { height: auto; color: var(--primary); background: none; border: 0; border-radius: 4px; align-self: flex-start; margin: 0; padding: 2px 4px; font-size: 12.5px; font-weight: 700; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-button][data-action]:hover { text-decoration: underline; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-button][data-action]:focus-visible { box-shadow: 0 0 0 2px var(--accent); outline: 0; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-close-button] { width: 22px; height: 22px; color: var(--muted-foreground); opacity: 0; background: none; border: 0; border-radius: 6px; transition: opacity .15s, background-color .15s; top: 8px; left: auto; right: 8px; transform: none; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"]:hover [data-close-button], [data-sonner-toast][data-styled="true"] [data-close-button]:focus-visible { opacity: 1; }
[data-sonner-toaster] [data-sonner-toast][data-styled="true"] [data-close-button]:hover { background: var(--secondary); color: var(--foreground); }
@media (prefers-reduced-motion: reduce) { [data-sonner-toaster] [data-sonner-toast][data-styled="true"][style*="--d"] { animation: none; } }
@media print { [data-sonner-toaster] { display: none !important; } }
`

/** Vùng hiển thị thông báo nhanh (sonner). Gọi `toast(...)`, `toast.success(...)`... ở bất kỳ đâu. */
export function Toaster({ toastOptions, duration = 4000, ...props }: React.ComponentProps<typeof Sonner>) {
  return (
    <>
      <style data-slot="toaster-style">{CSS}</style>
      <Sonner
        position="top-right"
        duration={duration}
        toastOptions={{ ...toastOptions, style: { ["--d" as string]: `${duration}ms`, ...toastOptions?.style } }}
        {...props}
      />
    </>
  )
}
export { toast }
