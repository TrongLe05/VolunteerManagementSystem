import { useState, type FormEvent } from "react";
import axios from "axios";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

import type { Organization } from "@/types/auth.types";
import type { Campaign } from "@/types/volunteer.types";
import { useAuth } from "@/context/AuthContext";
import { campaignApi } from "@/api/campaignApi";
import { getActivityStatusConfig } from "@/lib/activity-helpers";
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

interface AdminCampaignsTabProps {
  campaigns: Campaign[];
  organizations: Organization[];
  onRefresh: () => void;
}

interface StatusOption {
  value: string;
  label: string;
}

const CAMPAIGN_STATUS_LIST: StatusOption[] = [
  { value: "DRAFT", label: "Bản nháp (DRAFT)" },
  { value: "UPCOMING", label: "Sắp diễn ra (UPCOMING)" },
  { value: "ONGOING", label: "Đang diễn ra (ONGOING)" },
  { value: "COMPLETED", label: "Đã kết thúc (COMPLETED)" },
  { value: "CANCELLED", label: "Đã hủy (CANCELLED)" },
];

export function AdminCampaignsTab({
  campaigns,
  organizations,
  onRefresh,
}: AdminCampaignsTabProps) {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(
    CAMPAIGN_STATUS_LIST[1],
  );

  const openCreateModal = () => {
    setEditingCampaign(null);
    const defaultOrg =
      organizations.find((o) => o.id === user?.organizationId) ||
      organizations[0] ||
      null;
    setSelectedOrg(defaultOrg);
    setName("");
    setDescription("");
    const today = new Date().toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(today);
    setSelectedStatus(CAMPAIGN_STATUS_LIST[1]);
    setIsFormOpen(true);
  };

  const openEditModal = (camp: Campaign) => {
    setEditingCampaign(camp);
    setSelectedOrg(
      organizations.find((o) => o.id === camp.organizationId) || null,
    );
    setName(camp.name);
    setDescription(camp.description || "");
    setStartDate(camp.startDate);
    setEndDate(camp.endDate);
    setSelectedStatus(
      CAMPAIGN_STATUS_LIST.find((s) => s.value === camp.status) ||
        CAMPAIGN_STATUS_LIST[1],
    );
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCampaign && !selectedOrg) {
      toast.error("Vui lòng chọn đơn vị tổ chức chiến dịch.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCampaign) {
        await toast.promise(
          campaignApi.update(editingCampaign.id, {
            id: editingCampaign.id,
            name,
            description: description || null,
            startDate,
            endDate,
            status: selectedStatus.value,
          }),
          {
            loading: "Đang cập nhật chiến dịch...",
            success: "Cập nhật chiến dịch thành công!",
            error: (err) =>
              axios.isAxiosError(err)
                ? err.response?.data?.message ||
                  err.response?.data?.detail ||
                  "Không thể cập nhật chiến dịch."
                : "Lỗi kết nối máy chủ.",
          },
        );
      } else {
        await toast.promise(
          campaignApi.create({
            organizationId: selectedOrg!.id,
            name,
            description: description || null,
            startDate,
            endDate,
          }),
          {
            loading: "Đang tạo chiến dịch...",
            success: "Tạo chiến dịch mới thành công!",
            error: (err) =>
              axios.isAxiosError(err)
                ? err.response?.data?.message ||
                  err.response?.data?.detail ||
                  "Không thể tạo chiến dịch."
                : "Lỗi kết nối máy chủ.",
          },
        );
      }

      setIsFormOpen(false);
      onRefresh();
    } catch {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (camp: Campaign) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chiến dịch "${camp.name}"?`)) {
      return;
    }
    try {
      await toast.promise(campaignApi.remove(camp.id), {
        loading: "Đang xóa chiến dịch...",
        success: "Đã xóa chiến dịch.",
        error: (err) =>
          axios.isAxiosError(err)
            ? err.response?.data?.message ||
              err.response?.data?.detail ||
              "Chỉ có thể xóa chiến dịch đang ở trạng thái DRAFT."
            : "Lỗi kết nối máy chủ.",
      });
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
              Quản lý Chiến dịch Tình nguyện ({campaigns.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tạo mới, công bố trạng thái (`UPCOMING`, `ONGOING`, `COMPLETED`)
              cho các chiến dịch của đơn vị.
            </p>
          </div>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            Tạo Chiến dịch mới
          </Button>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Tên chiến dịch</TableHead>
                  <TableHead>Đơn vị tổ chức</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length > 0 ? (
                  campaigns.map((camp) => {
                    const statusCfg = getActivityStatusConfig(camp.status);
                    return (
                      <TableRow key={camp.id}>
                        <TableCell className="max-w-64">
                          <div className="font-semibold text-slate-900 truncate">
                            {camp.name}
                          </div>
                          {camp.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {camp.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {camp.organizationName}
                        </TableCell>
                        <TableCell className="text-xs">
                          {camp.startDate} → {camp.endDate}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusCfg.className}
                          >
                            {statusCfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => openEditModal(camp)}
                              title="Chỉnh sửa chiến dịch"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => handleDelete(camp)}
                              className="text-rose-600 hover:text-rose-700"
                              title="Xóa chiến dịch"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Chưa có chiến dịch nào.
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
              {editingCampaign
                ? "Cập nhật Chiến dịch"
                : "Tạo Chiến dịch Tình nguyện mới"}
            </DialogTitle>
            <DialogDescription>
              Chiến dịch mới tạo sẽ ở trạng thái DRAFT, bạn có thể chuyển sang
              UPCOMING hoặc ONGOING để công bố lên Bảng tin.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {!editingCampaign && (
              <div className="space-y-1.5">
                <Label>Đơn vị Đoàn - Hội tổ chức</Label>
                <Combobox<Organization>
                  items={organizations}
                  value={selectedOrg}
                  onValueChange={(org) => setSelectedOrg(org)}
                  itemToStringValue={(org) => String(org.id)}
                  itemToStringLabel={(org) => org.name}
                >
                  <ComboboxInput
                    placeholder="Chọn đơn vị..."
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>Không có đơn vị nào.</ComboboxEmpty>
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
            )}

            <div className="space-y-1.5">
              <Label>Tên chiến dịch</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Chiến dịch Mùa Hè Xanh 2026"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mô tả chiến dịch</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mục tiêu, ý nghĩa và phạm vi triển khai chiến dịch..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu</Label>
                <DatePicker
                  value={startDate ? new Date(startDate) : undefined}
                  onChange={(d) => setStartDate(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="Chọn ngày bắt đầu..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày kết thúc</Label>
                <DatePicker
                  value={endDate ? new Date(endDate) : undefined}
                  onChange={(d) => setEndDate(d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="Chọn ngày kết thúc..."
                />
              </div>
            </div>

            {editingCampaign && (
              <div className="space-y-1.5">
                <Label>Trạng thái chiến dịch</Label>
                <Combobox<StatusOption>
                  items={CAMPAIGN_STATUS_LIST}
                  value={selectedStatus}
                  onValueChange={(opt) => {
                    if (opt) setSelectedStatus(opt);
                  }}
                  itemToStringValue={(opt) => opt.value}
                  itemToStringLabel={(opt) => opt.label}
                >
                  <ComboboxInput className="w-full" />
                  <ComboboxContent>
                    <ComboboxList>
                      {(opt: StatusOption) => (
                        <ComboboxItem key={opt.value} value={opt}>
                          {opt.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            )}

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
                {isSubmitting ? "Đang lưu..." : "Lưu chiến dịch"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
