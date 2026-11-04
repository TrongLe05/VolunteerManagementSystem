import { useState } from "react";
import axios from "axios";
import { Copy, Eye, EyeOff, KeyRound, Sparkles } from "lucide-react";

import type { UserAccount } from "@/types/user.types";
import { userApi } from "@/api/userApi";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";

interface AdminResetPasswordDialogProps {
  user: UserAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminResetPasswordDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: AdminResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenerateRandom = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const handleCopy = async () => {
    if (!newPassword) return;
    try {
      await navigator.clipboard.writeText(newPassword);
      toast.success("Đã sao chép mật khẩu vào bộ nhớ tạm!");
    } catch {
      toast.info(newPassword);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setIsSubmitting(true);
    try {
      await userApi.resetPassword(user.id, newPassword);
      toast.success(`Đã đặt lại mật khẩu cho tài khoản "${user.username}" thành công!`);
      onOpenChange(false);
      setNewPassword("");
      onSuccess?.();
    } catch (err: unknown) {
      let msg = "Không thể đặt lại mật khẩu.";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.response?.data?.detail || msg;
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            <KeyRound className="size-5" />
            <DialogTitle>Đặt lại mật khẩu tài khoản</DialogTitle>
          </div>
          <DialogDescription>
            Đặt lại mật khẩu cho tài khoản{" "}
            <strong className="text-slate-900 font-bold">{user?.username}</strong> ({user?.email}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="admin-new-password">Mật khẩu mới</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleGenerateRandom}
                className="h-7 gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
              >
                <Sparkles className="size-3" /> Tạo ngẫu nhiên
              </Button>
            </div>

            <div className="relative">
              <Input
                id="admin-new-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập tối thiểu 6 ký tự..."
                className="pr-20"
                required
                minLength={6}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                {newPassword && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 text-slate-500 hover:text-slate-700"
                    onClick={handleCopy}
                    title="Sao chép"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-slate-500 hover:text-slate-700"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Ẩn" : "Hiện"}
                >
                  {showPassword ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Mật khẩu mới sẽ có hiệu lực ngay lập tức. Hãy sao chép để gửi cho người dùng.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
