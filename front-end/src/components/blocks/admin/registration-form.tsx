"use client"

// @dthu/ui 0.2.0 · block-admin
import * as React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export interface RegistrationFormValues { unitName: string; unitCode: string; applicantName: string; email: string; phone: string; modules: string[]; note: string }

export interface RegistrationFormProps {
  moduleOptions: string[]
  initialValues?: Partial<RegistrationFormValues>
  errors?: Partial<Record<keyof RegistrationFormValues, string>>
  submitting?: boolean
  onSubmit?: (v: RegistrationFormValues) => void
  onSaveDraft?: (v: RegistrationFormValues) => void
  onCancel?: () => void
}

/** Registration request form (đơn đăng ký). */
export function RegistrationForm({ moduleOptions, initialValues, errors: externalErrors, submitting, onSubmit, onSaveDraft, onCancel }: RegistrationFormProps) {
  const [v, setV] = React.useState<RegistrationFormValues>({ unitName: "", unitCode: "", applicantName: "", email: "", phone: "", modules: [], note: "", ...initialValues })
  const [localErrors, setLocalErrors] = React.useState<Partial<Record<keyof RegistrationFormValues, string>>>({})
  const errors = { ...localErrors, ...externalErrors }
  const validate = (): boolean => {
    const e: Partial<Record<keyof RegistrationFormValues, string>> = {}
    if (!v.unitName.trim()) e.unitName = "Vui lòng nhập tên đơn vị"
    if (!v.applicantName.trim()) e.applicantName = "Vui lòng nhập người đăng ký"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) e.email = "Thư điện tử không hợp lệ"
    if (v.phone && !/^[0-9+\s.-]{8,15}$/.test(v.phone)) e.phone = "Số điện thoại không hợp lệ"
    if (v.modules.length === 0) e.modules = "Chọn ít nhất một chức năng"
    setLocalErrors(e)
    return Object.keys(e).length === 0
  }
  const text = (key: Exclude<keyof RegistrationFormValues, "modules">, label: string, props: React.ComponentProps<"input"> = {}) => {
    const err = errors[key]
    return (
      <div className="grid gap-1.5">
        <Label htmlFor={`rf-${key}`}>{label}</Label>
        <Input id={`rf-${key}`} value={v[key]} aria-invalid={!!err} aria-describedby={err ? `rf-${key}-err` : undefined} onChange={(e) => setV({ ...v, [key]: e.target.value })} {...props} />
        {err && <p id={`rf-${key}-err`} className="text-xs text-destructive">{err}</p>}
      </div>
    )
  }
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <form noValidate onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit?.(v) }}>
        <CardHeader><CardTitle>Tạo đơn đăng ký</CardTitle><CardDescription>Đơn sẽ được gửi tới người duyệt của đơn vị. Bạn sẽ nhận thông báo khi có kết quả.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">{text("unitName", "Tên đơn vị")}{text("unitCode", "Mã đơn vị")}{text("applicantName", "Người đăng ký")}{text("phone", "Số điện thoại", { type: "tel" })}</div>
          {text("email", "Thư điện tử", { type: "email" })}
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-medium">Chức năng đăng ký sử dụng</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {moduleOptions.map((m) => (
                <div key={m} className="flex items-center gap-2"><Checkbox id={`rf-m-${m}`} checked={v.modules.includes(m)} onCheckedChange={(c) => setV({ ...v, modules: c === true ? [...v.modules, m] : v.modules.filter((x) => x !== m) })} /><Label htmlFor={`rf-m-${m}`} className="font-normal">{m}</Label></div>
              ))}
            </div>
            {errors.modules && <p className="text-xs text-destructive">{errors.modules}</p>}
          </fieldset>
          <div className="grid gap-1.5"><Label htmlFor="rf-note">Ghi chú</Label><Textarea id="rf-note" rows={3} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} /></div>
          {Object.keys(errors).length > 0 && <Alert variant="destructive"><AlertTitle>Chưa thể gửi đơn</AlertTitle><AlertDescription>Vui lòng kiểm tra các trường được đánh dấu.</AlertDescription></Alert>}
        </CardContent>
        <CardFooter className="justify-end gap-2"><Button type="button" variant="ghost" onClick={onCancel}>Huỷ</Button><Button type="button" variant="outline" onClick={() => onSaveDraft?.(v)}>Lưu nháp</Button><Button type="submit" disabled={submitting}>{submitting ? "Đang gửi…" : "Gửi đơn"}</Button></CardFooter>
      </form>
    </Card>
  )
}
