import { useEffect, useState } from "react";
import axios from "axios";
import { ShieldCheck, UserCheck, UserPlus, Users } from "lucide-react";

import type { Organization } from "@/types/auth.types";
import type { RoleItem, UserAccount } from "@/types/user.types";
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
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { toast } from "@/components/ui/toaster";

interface AdminUserFormDialogProps {
  user: UserAccount | null; // null => create mode, non-null => edit mode
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizations: Organization[];
  roles: RoleItem[];
  isSuperAdmin: boolean;
  onSuccess?: () => void;
}

export function AdminUserFormDialog({
  user,
  open,
  onOpenChange,
  organizations,
  roles,
  isSuperAdmin,
  onSuccess,
}: AdminUserFormDialogProps) {
  const isEditing = !!user;

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [studentCode, setStudentCode] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(["VOLUNTEER"]);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (user) {
        setUsername(user.username);
        setFullName(user.fullName || "");
        setEmail(user.email);
        setPassword("");
        setStudentCode(user.studentCode || "");
        setPhone(user.phone || "");
        setSelectedOrgId(user.organizationId);
        setSelectedRoles(user.roles && user.roles.length > 0 ? user.roles : ["VOLUNTEER"]);
        setIsActive(user.isActive);
      } else {
        setUsername("");
        setFullName("");
        setEmail("");
        setPassword("");
        setStudentCode("");
        setPhone("");
        setSelectedOrgId(organizations[0]?.id || "");
        setSelectedRoles(["VOLUNTEER"]);
        setIsActive(true);
      }
    }
  }, [open, user, organizations]);

  const selectedOrgObj = organizations.find((o) => o.id === selectedOrgId) || null;

  const toggleRole = (code: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(code)) {
        if (prev.length === 1) {
          toast.warning("Tài khoản cần có ít nhất một vai trò.");
          return prev;
        }
        return prev.filter((r) => r !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrgId) {
      toast.error("Vui lòng chọn đơn vị trực thuộc.");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 vai trò cho tài khoản.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && user) {
        await userApi.update(user.id, {
          email: email.trim(),
          organizationId: selectedOrgId,
          roleCodes: selectedRoles,
          isActive,
          fullName: fullName.trim() || undefined,
          studentCode: studentCode.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        toast.success(`Cập nhật thông tin tài khoản "${user.username}" thành công!`);
      } else {
        if (!password || password.length < 6) {
          toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
          setIsSubmitting(false);
          return;
        }

        await userApi.create({
          username: username.trim(),
          email: email.trim(),
          password,
          organizationId: selectedOrgId,
          roleCodes: selectedRoles,
          isActive,
          fullName: fullName.trim() || undefined,
          studentCode: studentCode.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        toast.success(`Tạo tài khoản "${username.trim()}" thành công!`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      let msg = isEditing ? "Không thể cập nhật tài khoản." : "Không thể tạo tài khoản.";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.response?.data?.detail || msg;
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableRoles = isSuperAdmin
    ? roles
    : roles.filter((r) => r.code !== "SUPER_ADMIN");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-600">
            {isEditing ? <UserCheck className="size-5" /> : <UserPlus className="size-5" />}
            <DialogTitle>
              {isEditing ? "Chỉnh sửa thông tin tài khoản" : "Tạo mới tài khoản người dùng"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isEditing
              ? `Cập nhật thông tin, vai trò và phân quyền đơn vị cho tài khoản ${user?.username}.`
              : "Thêm tài khoản cán bộ Đoàn - Hội hoặc Tình nguyện viên vào hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Thông tin đăng nhập cơ bản */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="form-username">
                Tên đăng nhập <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="form-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="vd: canbo_doan, sinhvien01"
                disabled={isEditing}
                required
                minLength={3}
              />
              {isEditing && (
                <p className="text-[11px] text-muted-foreground">
                  Không thể đổi tên đăng nhập của tài khoản đã tồn tại.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-email">
                Email liên hệ <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="form-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vd: example@dthu.edu.vn"
                required
              />
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-1.5">
              <Label htmlFor="form-password">
                Mật khẩu khởi tạo <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="form-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 6 ký tự..."
                required
                minLength={6}
              />
            </div>
          )}

          {/* Họ tên & Mã số sinh viên / Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="form-fullname">Họ và tên</Label>
              <Input
                id="form-fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="vd: Nguyễn Văn An"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="form-student-code">Mã số sinh viên (MSSV)</Label>
              <Input
                id="form-student-code"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                placeholder="vd: 0023412345"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="form-phone">Số điện thoại</Label>
              <Input
                id="form-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="vd: 0987654321"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Trạng thái tài khoản</Label>
              <div className="pt-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    {isActive ? (
                      <span className="text-emerald-700 font-semibold">Đang hoạt động (Kích hoạt)</span>
                    ) : (
                      <span className="text-rose-600 font-semibold">Đã bị khóa (Vô hiệu hóa)</span>
                    )}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Đơn vị tổ chức trực thuộc */}
          <div className="space-y-1.5">
            <Label>
              Đơn vị Đoàn - Hội trực thuộc <span className="text-rose-500">*</span>
            </Label>
            <Combobox
              value={selectedOrgObj}
              onValueChange={(val) => {
                if (val) setSelectedOrgId(val.id);
              }}
            >
              <ComboboxInput
                placeholder="Chọn hoặc tìm đơn vị Đoàn - Hội..."
                className="w-full text-xs sm:text-sm"
              />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>Không tìm thấy đơn vị phù hợp.</ComboboxEmpty>
                  {organizations.map((org) => (
                    <ComboboxItem key={org.id} value={org}>
                      {org.name} ({org.code})
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {/* Vai trò / Phân quyền */}
          <div className="space-y-2 pt-1">
            <Label>
              Vai trò tài khoản <span className="text-rose-500">*</span>
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {availableRoles.map((role) => {
                const isChecked = selectedRoles.includes(role.code);
                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.code)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                      isChecked
                        ? "border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by parent onClick
                      className="mt-0.5 size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                        {role.code === "SUPER_ADMIN" ? (
                          <ShieldCheck className="size-3.5 text-purple-600 shrink-0" />
                        ) : role.code === "ORGANIZATION_ADMIN" ? (
                          <ShieldCheck className="size-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <Users className="size-3.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="truncate">{role.name}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {role.description || role.code}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-4 border-t border-slate-100">
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
              {isSubmitting
                ? "Đang lưu..."
                : isEditing
                  ? "Lưu thay đổi"
                  : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
