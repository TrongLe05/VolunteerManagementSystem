import { useState, type FormEvent } from "react";
import axios from "axios";
import { Pencil, Plus, Trash2 } from "lucide-react";

import type { Organization } from "@/types/auth.types";
import { useAuth } from "@/context/AuthContext";
import { organizationApi } from "@/api/organizationApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { AdminTableRowSkeleton } from "@/components/common/Skeletons";

interface AdminOrganizationsTabProps {
  organizations: Organization[];
  isLoading?: boolean;
  onRefresh: () => void;
}

export function AdminOrganizationsTab({
  organizations,
  isLoading = false,
  onRefresh,
}: AdminOrganizationsTabProps) {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [parentOrg, setParentOrg] = useState<Organization | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const openCreateModal = () => {
    setEditingOrg(null);
    const defaultParent =
      organizations.find((o) => o.id === user?.organizationId) ||
      organizations[0] ||
      null;
    setParentOrg(defaultParent);
    setCode("");
    setName("");
    setDescription("");
    setIsActive(true);
    setIsFormOpen(true);
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setParentOrg(
      org.parentId
        ? organizations.find((o) => o.id === org.parentId) || null
        : null,
    );
    setCode(org.code);
    setName(org.name);
    setDescription(org.description || "");
    setIsActive(org.isActive);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingOrg) {
        await organizationApi.update(editingOrg.id, {
          id: editingOrg.id,
          parentId: parentOrg ? parentOrg.id : null,
          code,
          name,
          description: description || null,
          isActive,
        });
      } else {
        await organizationApi.create({
          parentId: parentOrg ? parentOrg.id : null,
          code,
          name,
          description: description || null,
        });
      }
      setIsFormOpen(false);
      onRefresh();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        const msg =
          resData?.message ||
          resData?.detail ||
          resData?.title ||
          "Không thể lưu đơn vị. Vui lòng kiểm tra lại.";
        toast.error(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (org: Organization) => {
    setDeletingOrg(org);
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrg) return;
    try {
      await toast.promise(organizationApi.remove(deletingOrg.id), {
        loading: "Đang xóa đơn vị...",
        success: "Đã xóa đơn vị.",
        error: (err) =>
          axios.isAxiosError(err)
            ? err.response?.data?.message ||
              err.response?.data?.detail ||
              "Không thể xóa đơn vị (đang có đơn vị con hoặc dữ liệu ràng buộc)."
            : "Lỗi kết nối máy chủ.",
      });
      setDeletingOrg(null);
      onRefresh();
    } catch {
      // Handled
    }
  };

  return (
    <>
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold">
              Cơ cấu Tổ chức Đoàn - Hội ({organizations.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quản lý cây phân cấp Đoàn Trường, Liên Chi đoàn Khoa và các Chi
              đoàn / CLB trực thuộc.
            </p>
          </div>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            Thêm Đơn vị con
          </Button>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Mã đơn vị</TableHead>
                  <TableHead>Tên đơn vị Đoàn - Hội</TableHead>
                  <TableHead>Đơn vị cấp trên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <AdminTableRowSkeleton columns={5} rows={4} />
                ) : organizations.length > 0 ? (
                  organizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-mono text-xs font-semibold text-blue-700">
                        {org.code}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">
                          {org.name}
                        </div>
                        {org.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-64">
                            {org.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {org.parentName || "Cấp cao nhất (Root)"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            org.isActive
                              ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                              : "bg-slate-500/15 text-slate-700"
                          }
                        >
                          {org.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => openEditModal(org)}
                            title="Chỉnh sửa đơn vị"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon-xs"
                            variant="ghost"
                            onClick={() => handleDelete(org)}
                            className="text-rose-600 hover:text-rose-700"
                            title="Xóa đơn vị"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Chưa có đơn vị nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingOrg
                ? "Cập nhật Đơn vị Đoàn - Hội"
                : "Thêm Đơn vị Đoàn - Hội mới"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập mã định danh, tên gọi và đơn vị cấp trên trong cây tổ
              chức.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Đơn vị cấp trên</Label>
              <Combobox<Organization>
                items={organizations.filter((o) => o.id !== editingOrg?.id)}
                value={parentOrg}
                onValueChange={(org) => setParentOrg(org)}
                itemToStringValue={(org) => String(org.id)}
                itemToStringLabel={(org) => org.name}
              >
                <ComboboxInput
                  placeholder="Chọn đơn vị cấp trên..."
                  className="w-full"
                  showClear={Boolean(parentOrg)}
                />
                <ComboboxContent>
                  <ComboboxEmpty>Không tìm thấy đơn vị.</ComboboxEmpty>
                  <ComboboxList>
                    {(org: Organization) => (
                      <ComboboxItem key={org.id} value={org}>
                        {org.name}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
            </div>

            <div className="space-y-1.5">
              <Label>Mã đơn vị (Code)</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="VD: CHI_DOAN_CNTT_23A"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tên đơn vị</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chi đoàn ĐH CNTT 23A"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chức năng, nhiệm vụ của đơn vị..."
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSubmitting ? "Đang lưu..." : "Lưu đơn vị"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hộp thoại xác nhận xóa chuẩn AlertDialog của dthu-kit */}
      <ConfirmDialog
        open={Boolean(deletingOrg)}
        onOpenChange={(open) => !open && setDeletingOrg(null)}
        title="Xác nhận xóa đơn vị?"
        description={
          deletingOrg
            ? `Bạn có chắc muốn xóa đơn vị "${deletingOrg.name}"? Hành động này sẽ xóa dữ liệu đơn vị khỏi cây tổ chức và không thể hoàn tác.`
            : undefined
        }
        confirmLabel="Xóa đơn vị"
        cancelLabel="Hủy"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
