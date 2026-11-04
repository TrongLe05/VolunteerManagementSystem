import * as React from "react"
import { KeyRound, LogOut, Moon, ShieldCheck, Sun, User } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/alert-dialog"
import { DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

export interface AccountMenuItemsProps {
  /** Heading of the menu (user's display name). */
  name: string
  onProfile?: () => void
  /** "Bảo mật tài khoản" (password, 2FA, devices). */
  onSecurity?: () => void
  onChangePassword?: () => void
  /** Show the theme switch. */
  dark?: boolean
  onToggleTheme?: () => void
  /** Called when "Đăng xuất" is chosen; omit to hide the item. Open a `SignOutDialog` here: it must live outside the menu, which unmounts on close. */
  onSignOut?: () => void
  /** Extra items placed before the separator (e.g. "Quay lại trang tài liệu"). */
  children?: React.ReactNode
}

/**
 * Content for `AppShell` / `AppLayout`'s `userMenu`: profile, security, change password, theme and "Đăng xuất".
 * Pair it with `SignOutDialog` (state kept by the host) to confirm before ending the session.
 */
export function AccountMenuItems({ name, onProfile, onSecurity, onChangePassword, dark, onToggleTheme, onSignOut, children }: AccountMenuItemsProps) {
  return (
    <>
      <DropdownMenuLabel>{name}</DropdownMenuLabel>
      {onProfile && <DropdownMenuItem onSelect={onProfile}><User />Thông tin cá nhân</DropdownMenuItem>}
      {onSecurity && <DropdownMenuItem onSelect={onSecurity}><ShieldCheck />Bảo mật tài khoản</DropdownMenuItem>}
      {onChangePassword && <DropdownMenuItem onSelect={onChangePassword}><KeyRound />Đổi mật khẩu</DropdownMenuItem>}
      {onToggleTheme && <DropdownMenuItem onSelect={onToggleTheme}>{dark ? <Sun /> : <Moon />}{dark ? "Giao diện sáng" : "Giao diện tối"}</DropdownMenuItem>}
      {children}
      {onSignOut && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onSignOut}><LogOut />Đăng xuất</DropdownMenuItem>
        </>
      )}
    </>
  )
}

export interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<unknown>
  /** Warn that unsaved work is lost. */
  unsavedChanges?: boolean
}

/** "Đăng xuất khỏi hệ thống?" confirmation. The confirm button shows a spinner while `onConfirm` is pending. */
export function SignOutDialog({ open, onOpenChange, onConfirm, unsavedChanges }: SignOutDialogProps) {
  return <ConfirmDialog open={open} onOpenChange={onOpenChange} title="Đăng xuất khỏi hệ thống?" description={unsavedChanges ? "Bạn còn thay đổi chưa lưu, chúng sẽ bị mất nếu đăng xuất." : "Phiên làm việc trên thiết bị này sẽ kết thúc."} confirmLabel="Đăng xuất" variant={unsavedChanges ? "destructive" : "default"} onConfirm={onConfirm} />
}
