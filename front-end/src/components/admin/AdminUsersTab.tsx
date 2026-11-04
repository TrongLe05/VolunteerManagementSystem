import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Unlock,
  UserCog,
  Users,
} from "lucide-react";

import type { Organization } from "@/types/auth.types";
import type { RoleItem, UserAccount } from "@/types/user.types";
import { userApi } from "@/api/userApi";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toaster";
import { AdminUserFormDialog } from "@/components/admin/AdminUserFormDialog";
import { AdminResetPasswordDialog } from "@/components/admin/AdminResetPasswordDialog";

interface AdminUsersTabProps {
  organizations: Organization[];
  onCountChanged?: (count: number) => void;
}

export function AdminUsersTab({
  organizations,
  onCountChanged,
}: AdminUsersTabProps) {
  const { user: currentUser, hasRole } = useAuth();
  const isSuperAdmin = hasRole(["SUPER_ADMIN"]);

  const [users, setUsers] = useState<UserAccount[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false);
  const [resetPwdUser, setResetPwdUser] = useState<UserAccount | null>(null);

  const [isToggleStatusOpen, setIsToggleStatusOpen] = useState(false);
  const [toggleStatusUser, setToggleStatusUser] = useState<UserAccount | null>(
    null,
  );
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const selectedOrgObj = useMemo(
    () => organizations.find((o) => o.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );

  // Fetch Roles list once
  useEffect(() => {
    userApi
      .getRoles()
      .then((data) => setRoles(data || []))
      .catch(() => setRoles([]));
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await userApi.getAll({
        searchTerm: searchTerm.trim() || undefined,
        organizationId: selectedOrgId || undefined,
        role: selectedRole !== "ALL" ? selectedRole : undefined,
        isActive:
          selectedStatus === "ACTIVE"
            ? true
            : selectedStatus === "LOCKED"
              ? false
              : undefined,
        pageNumber,
        pageSize: 12,
      });

      setUsers(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
      onCountChanged?.(res.totalCount || 0);
    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng:", err);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchTerm,
    selectedOrgId,
    selectedRole,
    selectedStatus,
    pageNumber,
    onCountChanged,
  ]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: UserAccount) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleOpenResetPwd = (user: UserAccount) => {
    setResetPwdUser(user);
    setIsResetPwdOpen(true);
  };

  const handleOpenToggleStatus = (user: UserAccount) => {
    if (user.id === currentUser?.id) {
      toast.warning("Bạn không thể tự khóa tài khoản của chính mình.");
      return;
    }
    setToggleStatusUser(user);
    setIsToggleStatusOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!toggleStatusUser) return;

    setIsTogglingStatus(true);
    try {
      const nextStatus = !toggleStatusUser.isActive;
      await userApi.toggleStatus(toggleStatusUser.id, nextStatus);
      toast.success(
        nextStatus
          ? `Đã mở khóa tài khoản "${toggleStatusUser.username}".`
          : `Đã khóa tài khoản "${toggleStatusUser.username}".`,
      );
      setIsToggleStatusOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      let msg = "Không thể thay đổi trạng thái tài khoản.";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.message || err.response?.data?.detail || msg;
      }
      toast.error(msg);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // Helper stats
  const activeCount = useMemo(
    () => users.filter((u) => u.isActive).length,
    [users],
  );
  const lockedCount = useMemo(
    () => users.filter((u) => !u.isActive).length,
    [users],
  );

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề tab & Nút thao tác */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCog className="size-6 text-blue-600" />
            Quản lý Tài khoản & Phân quyền
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Quản lý tài khoản cán bộ Đoàn - Hội, quản trị viên và tình nguyện
            viên trong hệ thống
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            disabled={isLoading}
            className="gap-1.5 text-xs text-slate-700"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs text-xs font-semibold"
          >
            <Plus className="size-4" />
            Thêm tài khoản mới
          </Button>
        </div>
      </div>

      {/* 2. Thẻ thống kê nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Tổng tài khoản
              </p>
              <p className="text-xl font-bold text-slate-900">{totalCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600 shrink-0">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Cán bộ / Quản trị
              </p>
              <p className="text-xl font-bold text-purple-700">
                {
                  users.filter((u) => u.roles.some((r) => r.includes("ADMIN")))
                    .length
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Đang hoạt động
              </p>
              <p className="text-xl font-bold text-emerald-700">
                {activeCount}{" "}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600 shrink-0">
              <Lock className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Đã bị khóa
              </p>
              <p className="text-xl font-bold text-rose-700">{lockedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Bộ lọc tìm kiếm */}
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Tìm kiếm theo tên / email / MSSV */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Tìm username, họ tên, email, MSSV..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPageNumber(1);
                }}
                className="pl-9 text-xs sm:text-sm"
              />
            </div>

            {/* Lọc theo đơn vị tổ chức */}
            <div>
              <Combobox
                value={selectedOrgObj}
                onValueChange={(val) => {
                  setSelectedOrgId(val ? val.id : "");
                  setPageNumber(1);
                }}
              >
                <ComboboxInput
                  placeholder="Lọc theo đơn vị..."
                  className="w-full text-xs sm:text-sm"
                />
                <ComboboxContent>
                  <ComboboxList>
                    <ComboboxItem value={null}>Tất cả đơn vị</ComboboxItem>
                    {organizations.map((org) => (
                      <ComboboxItem key={org.id} value={org}>
                        {org.name}
                      </ComboboxItem>
                    ))}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            {/* Lọc theo vai trò */}
            <div>
              <Select
                value={selectedRole}
                onValueChange={(val) => {
                  setSelectedRole(val);
                  setPageNumber(1);
                }}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="SUPER_ADMIN">
                      Quản trị viên cấp cao (SUPER_ADMIN)
                    </SelectItem>
                  )}
                  <SelectItem value="ORGANIZATION_ADMIN">
                    Cán bộ Đoàn - Hội (ORGANIZATION_ADMIN)
                  </SelectItem>
                  <SelectItem value="VOLUNTEER">
                    Tình nguyện viên (VOLUNTEER)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lọc theo trạng thái */}
            <div>
              <Select
                value={selectedStatus}
                onValueChange={(val) => {
                  setSelectedStatus(val);
                  setPageNumber(1);
                }}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                  <SelectItem value="LOCKED">Đã bị khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Bảng danh sách tài khoản */}
      <Card className="border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-[280px]">Người dùng / Họ tên</TableHead>
                <TableHead>Email & Thông tin</TableHead>
                <TableHead>Đơn vị Đoàn - Hội</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-14 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <RefreshCw className="size-4 animate-spin text-blue-600" />
                        Đang tải danh sách tài khoản...
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-44 text-center">
                    <EmptyState
                      icon={<Users className="size-6 text-slate-400" />}
                      title="Không tìm thấy tài khoản nào"
                      description="Hãy thử thay đổi điều kiện tìm kiếm hoặc thêm tài khoản mới vào hệ thống."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((acc) => {
                  const isSelf = acc.id === currentUser?.id;
                  const initials = acc.username.slice(0, 2).toUpperCase();

                  return (
                    <TableRow key={acc.id} className="hover:bg-slate-50/70">
                      {/* Cột 1: Avatar, Username & Full name */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 border border-slate-200">
                            {acc.avatarUrl && (
                              <AvatarImage
                                src={acc.avatarUrl}
                                alt={acc.username}
                              />
                            )}
                            <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                              {acc.username}
                              {isSelf && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700">
                                  Bạn
                                </span>
                              )}
                            </p>
                            {acc.fullName ? (
                              <p className="text-xs text-slate-600 truncate">
                                {acc.fullName}
                              </p>
                            ) : (
                              <p className="text-[11px] text-muted-foreground italic truncate">
                                Chưa cập nhật họ tên
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Cột 2: Email & Student Code */}
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <p className="text-slate-800 font-medium truncate">
                            {acc.email}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            {acc.studentCode && (
                              <span>MSSV: {acc.studentCode}</span>
                            )}
                            {acc.phone && <span>SĐT: {acc.phone}</span>}
                          </div>
                        </div>
                      </TableCell>

                      {/* Cột 3: Đơn vị tổ chức */}
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 max-w-[220px]">
                          <Building2 className="size-3.5 text-blue-600 shrink-0" />
                          <span
                            className="truncate"
                            title={acc.organizationName}
                          >
                            {acc.organizationName || "Chưa phân đơn vị"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Cột 4: Vai trò */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {acc.roles.map((r) => {
                            if (r === "SUPER_ADMIN") {
                              return (
                                <Badge
                                  key={r}
                                  variant="outline"
                                  className="border-purple-200 bg-purple-50 text-purple-700 text-[10px] font-semibold"
                                >
                                  Quản trị cấp cao
                                </Badge>
                              );
                            }
                            if (r === "ORGANIZATION_ADMIN") {
                              return (
                                <Badge
                                  key={r}
                                  variant="outline"
                                  className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] font-semibold"
                                >
                                  Cán bộ Đoàn - Hội
                                </Badge>
                              );
                            }
                            return (
                              <Badge
                                key={r}
                                variant="outline"
                                className="border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-semibold"
                              >
                                Tình nguyện viên
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>

                      {/* Cột 5: Trạng thái */}
                      <TableCell>
                        {acc.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 border border-rose-200">
                            <span className="size-1.5 rounded-full bg-rose-500" />
                            Đã khóa
                          </span>
                        )}
                      </TableCell>

                      {/* Cột 6: Thao tác */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(acc)}
                            className="size-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                            title="Chỉnh sửa thông tin"
                          >
                            <Pencil className="size-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenResetPwd(acc)}
                            className="size-8 text-slate-600 hover:text-amber-600 hover:bg-amber-50"
                            title="Đặt lại mật khẩu"
                          >
                            <KeyRound className="size-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isSelf}
                            onClick={() => handleOpenToggleStatus(acc)}
                            className={`size-8 ${
                              acc.isActive
                                ? "text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                                : "text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={
                              isSelf
                                ? "Không thể tự khóa tài khoản của mình"
                                : acc.isActive
                                  ? "Khóa tài khoản"
                                  : "Mở khóa tài khoản"
                            }
                          >
                            {acc.isActive ? (
                              <Lock className="size-4" />
                            ) : (
                              <Unlock className="size-4 text-emerald-600" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="border-t border-slate-200 p-4">
            <Pagination
              page={pageNumber}
              pageCount={totalPages}
              onPageChange={setPageNumber}
            />
          </div>
        )}
      </Card>

      {/* Modal Tạo/Sửa tài khoản */}
      <AdminUserFormDialog
        user={editingUser}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        organizations={organizations}
        roles={roles}
        isSuperAdmin={isSuperAdmin}
        onSuccess={fetchUsers}
      />

      {/* Modal Đặt lại mật khẩu */}
      <AdminResetPasswordDialog
        user={resetPwdUser}
        open={isResetPwdOpen}
        onOpenChange={setIsResetPwdOpen}
      />

      {/* Dialog xác nhận Khóa / Mở khóa tài khoản */}
      <ConfirmDialog
        open={isToggleStatusOpen}
        onOpenChange={setIsToggleStatusOpen}
        title={
          toggleStatusUser?.isActive
            ? "Xác nhận khóa tài khoản"
            : "Xác nhận mở khóa tài khoản"
        }
        description={
          toggleStatusUser?.isActive
            ? `Bạn có chắc chắn muốn khóa tài khoản "${toggleStatusUser?.username}" (${toggleStatusUser?.email})? Người dùng sẽ không thể đăng nhập vào hệ thống sau khi bị khóa.`
            : `Mở khóa cho tài khoản "${toggleStatusUser?.username}" (${toggleStatusUser?.email})? Người dùng sẽ có thể đăng nhập bình thường.`
        }
        confirmLabel={
          toggleStatusUser?.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"
        }
        cancelLabel="Hủy"
        variant={toggleStatusUser?.isActive ? "destructive" : "default"}
        loading={isTogglingStatus}
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  );
}
