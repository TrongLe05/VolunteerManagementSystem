"use client"

// @dthu/ui 0.2.0 · alert-dialog
import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "radix-ui"
import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import { useUiConfig } from "@/lib/ui-config"

/** Hộp thoại cảnh báo/xác nhận: chặn tương tác nền, không đóng khi bấm ra ngoài. */
export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger

/** Nội dung hộp thoại; luôn kèm `AlertDialogTitle` và `AlertDialogDescription`. */
export function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Overlay className="fixed inset-0 z-overlay bg-[rgba(16,28,44,0.48)] anim-fade" />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn("anim-pop fixed top-1/2 left-1/2 z-overlay grid w-full max-w-[calc(100%-1.5rem)] -translate-x-1/2 -translate-y-1/2 gap-0 rounded-lg bg-background p-0 text-foreground shadow-[0_3px_12px_#101c2c1a,0_1px_3px_#101c2c12] outline-none sm:max-w-[26rem]", className)}
        {...props}
      />
    </AlertDialogPrimitive.Portal>
  )
}
export function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 px-[18px] pt-4 pb-3 text-left", className)} {...props} />
}
export function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col-reverse flex-wrap gap-2 rounded-b-lg border-t border-border bg-secondary px-[18px] py-2.5 sm:flex-row sm:items-center sm:justify-end", className)} {...props} />
}
export function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return <AlertDialogPrimitive.Title className={cn("text-emph leading-tight font-bold text-foreground", className)} {...props} />
}
export function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return <AlertDialogPrimitive.Description className={cn("text-body leading-normal text-muted-foreground", className)} {...props} />
}
/** Nút xác nhận (đóng hộp thoại). `variant="destructive"` cho hành động xóa. */
export function AlertDialogAction({ className, variant, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action> & {
  /** Kiểu nút: default hoặc destructive. */
  variant?: "default" | "destructive"
}) {
  return <AlertDialogPrimitive.Action className={cn(buttonVariants({ variant }), className)} {...props} />
}
/** Nút hủy (đóng hộp thoại, focus mặc định rơi vào đây). */
export function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return <AlertDialogPrimitive.Cancel className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />
}

export interface ConfirmDialogProps {
  /** Trạng thái mở. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tiêu đề, vd. "Xóa văn bản?". */
  title: React.ReactNode
  /** Mô tả hậu quả của hành động. */
  description?: React.ReactNode
  /** Nhãn nút xác nhận. Mặc định "Xác nhận". @default Xác nhận */
  confirmLabel?: string
  /** Nhãn nút hủy. Mặc định "Hủy". @default Hủy */
  cancelLabel?: string
  /** `destructive` tô đỏ nút xác nhận. */
  variant?: "default" | "destructive"
  /** Đang xử lý: khóa cả hai nút và hiện vòng quay. */
  loading?: boolean
  /** Gọi khi xác nhận. Nếu trả về Promise, hộp thoại giữ mở (hiện loading) tới khi xong rồi tự đóng; nếu Promise lỗi thì giữ mở. */
  onConfirm: () => void | Promise<unknown>
}

/** Hộp thoại xác nhận dựng sẵn: tiêu đề, mô tả, nút Hủy/Xác nhận, hỗ trợ xử lý bất đồng bộ. */
export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, cancelLabel, variant = "default", loading, onConfirm }: ConfirmDialogProps) {
  const { labels } = useUiConfig()
  const [pending, setPending] = React.useState(false)
  const busy = loading || pending
  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault()
    try {
      const r = onConfirm()
      if (r && typeof (r as Promise<unknown>).then === "function") {
        setPending(true)
        await r
      }
      onOpenChange(false)
    } catch {
      /* giữ hộp thoại mở để người dùng thử lại */
    } finally {
      setPending(false)
    }
  }
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : <AlertDialogDescription className="sr-only">{typeof title === "string" ? title : labels.confirmAction}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel ?? labels.cancel}</AlertDialogCancel>
          <Button variant={variant === "destructive" ? "destructive" : "default"} disabled={busy} aria-busy={busy || undefined} onClick={handleConfirm}>
            {busy && <LoaderCircle className="animate-spin" />}
            {confirmLabel ?? labels.confirmAction}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export interface ConfirmOptions {
  title: React.ReactNode
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>
const ConfirmContext = React.createContext<ConfirmFn | null>(null)

/** Bọc ứng dụng một lần để dùng `useConfirm()` ở bất kỳ đâu. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<{ options: ConfirmOptions; open: boolean } | null>(null)
  const resolver = React.useRef<((v: boolean) => void) | null>(null)
  const confirm = React.useCallback<ConfirmFn>((options) => {
    resolver.current?.(false)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
      setState({ options, open: true })
    })
  }, [])
  function settle(v: boolean) {
    resolver.current?.(v)
    resolver.current = null
    setState((s) => (s ? { ...s, open: false } : s))
  }
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <ConfirmDialog
          {...state.options}
          open={state.open}
          onOpenChange={(o) => { if (!o) settle(false) }}
          onConfirm={() => settle(true)}
        />
      )}
    </ConfirmContext.Provider>
  )
}

/** Trả về hàm `confirm(options)` -> Promise<boolean> (true khi người dùng xác nhận). Cần `ConfirmProvider` phía trên. */
export function useConfirm(): ConfirmFn {
  const ctx = React.useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm phải được dùng bên trong <ConfirmProvider>")
  return ctx
}
