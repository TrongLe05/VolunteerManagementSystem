import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import axios from "axios";
import { Pencil, Plus, ScanFace, Trash2, Users } from "lucide-react";

import type {
  Activity,
  ActivityLocationInput,
  Campaign,
} from "@/types/volunteer.types";
import { activityApi } from "@/api/activityApi";
import {
  formatDateTimeVN,
  getActivityStatusConfig,
} from "@/lib/activity-helpers";
import { AdminRegistrationsDialog } from "./AdminRegistrationsDialog";
import { LocationMapPicker } from "./LocationMapPicker";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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

interface AdminActivitiesTabProps {
  activities: Activity[];
  campaigns: Campaign[];
  onRefresh: () => void;
  isLoading?: boolean;
}

interface StatusOption {
  value: string;
  label: string;
}

const ACTIVITY_STATUS_LIST: StatusOption[] = [
  { value: "DRAFT", label: "Bản nháp (DRAFT)" },
  { value: "OPEN", label: "Mở đăng ký (OPEN)" },
  { value: "ONGOING", label: "Đang diễn ra (ONGOING)" },
  { value: "COMPLETED", label: "Đã hoàn thành (COMPLETED)" },
  { value: "CANCELLED", label: "Đã hủy (CANCELLED)" },
];

function getDefaultActivityTimesForCampaign(camp?: Campaign | null) {
  const todayStr = new Date().toISOString().slice(0, 10);
  let targetDate = todayStr;

  if (camp?.startDate && camp?.endDate) {
    if (todayStr < camp.startDate || todayStr > camp.endDate) {
      targetDate = camp.startDate;
    }
  }

  return {
    start: `${targetDate}T07:30:00`,
    end: `${targetDate}T11:30:00`,
  };
}

export function AdminActivitiesTab({
  activities,
  campaigns,
  onRefresh,
  isLoading = false,
}: AdminActivitiesTabProps) {
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [reviewActivity, setReviewActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [capacity, setCapacity] = useState<string>("50");
  const [creditDays, setCreditDays] = useState<string>("1");
  const [selectedStatus, setSelectedStatus] = useState<StatusOption>(
    ACTIVITY_STATUS_LIST[1],
  );
  const [locations, setLocations] = useState<ActivityLocationInput[]>([
    {
      name: "Khuôn viên Trường Đại học Đồng Tháp",
      address: "783 Phạm Hữu Lầu, P.6, TP. Cao Lãnh, Đồng Tháp",
      latitude: 10.4602,
      longitude: 105.6425,
      allowedRadiusMeters: 150,
    },
  ]);

  const openCreateModal = () => {
    setEditingActivity(null);
    const defaultCampaign = campaigns[0] || null;
    setSelectedCampaign(defaultCampaign);
    setName("");
    setDescription("");
    const defaultTimes = getDefaultActivityTimesForCampaign(defaultCampaign);
    setStartDate(new Date(defaultTimes.start));
    setEndDate(new Date(defaultTimes.end));
    setCapacity("50");
    setCreditDays("1");
    setSelectedStatus(ACTIVITY_STATUS_LIST[1]);
    setLocations([
      {
        name: "Khuôn viên Trường Đại học Đồng Tháp",
        address: "783 Phạm Hữu Lầu, P.6, TP. Cao Lãnh, Đồng Tháp",
        latitude: 10.4602,
        longitude: 105.6425,
        allowedRadiusMeters: 150,
      },
    ]);
    setIsFormOpen(true);
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setSelectedCampaign(campaigns.find((c) => c.id === act.campaignId) || null);
    setName(act.name);
    setDescription(act.description || "");
    const start = act.startTime ? new Date(act.startTime) : undefined;
    const end = act.endTime ? new Date(act.endTime) : undefined;
    setStartDate(start);
    setEndDate(end);
    setCapacity(act.capacity ? String(act.capacity) : "50");
    setCreditDays(String(act.creditDays));

    // Tự động suy luận trạng thái chuẩn xác theo thời gian nếu không phải DRAFT hoặc CANCELLED
    let targetStatus = act.status;
    if (act.status !== "DRAFT" && act.status !== "CANCELLED") {
      const now = new Date();
      if (end && end <= now) {
        targetStatus = "COMPLETED";
      } else if (start && start <= now) {
        targetStatus = "ONGOING";
      } else if (start && start > now) {
        targetStatus = "OPEN";
      }
    }

    setSelectedStatus(
      ACTIVITY_STATUS_LIST.find((s) => s.value === targetStatus) ||
        ACTIVITY_STATUS_LIST[1],
    );
    setLocations(
      act.locations?.length
        ? act.locations.map((l) => ({
            name: l.name,
            address: l.address || "",
            latitude: l.latitude,
            longitude: l.longitude,
            allowedRadiusMeters: l.allowedRadiusMeters,
          }))
        : [
            {
              name: "Khuôn viên Trường Đại học Đồng Tháp",
              address: "783 Phạm Hữu Lầu, P.6, TP. Cao Lãnh, Đồng Tháp",
              latitude: 10.4602,
              longitude: 105.6425,
              allowedRadiusMeters: 150,
            },
          ],
    );
    setIsFormOpen(true);
  };

  const handleStartDateChange = (d: Date | undefined) => {
    setStartDate(d);
    if (editingActivity && selectedStatus.value !== "DRAFT" && selectedStatus.value !== "CANCELLED") {
      const now = new Date();
      if (endDate && endDate <= now) {
        setSelectedStatus(ACTIVITY_STATUS_LIST.find((s) => s.value === "COMPLETED") || selectedStatus);
      } else if (d && d <= now) {
        setSelectedStatus(ACTIVITY_STATUS_LIST.find((s) => s.value === "ONGOING") || selectedStatus);
      } else if (d && d > now) {
        setSelectedStatus(ACTIVITY_STATUS_LIST.find((s) => s.value === "OPEN") || selectedStatus);
      }
    }
  };

  const handleEndDateChange = (d: Date | undefined) => {
    setEndDate(d);
    if (editingActivity && selectedStatus.value !== "DRAFT" && selectedStatus.value !== "CANCELLED") {
      const now = new Date();
      if (d && d <= now) {
        setSelectedStatus(ACTIVITY_STATUS_LIST.find((s) => s.value === "COMPLETED") || selectedStatus);
      } else if (startDate && startDate <= now) {
        setSelectedStatus(ACTIVITY_STATUS_LIST.find((s) => s.value === "ONGOING") || selectedStatus);
      } else if (startDate && startDate > now) {
        setSelectedStatus(ACTIVITY_STATUS_LIST.find((s) => s.value === "OPEN") || selectedStatus);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingActivity && !selectedCampaign) {
      toast.error("Vui lòng chọn chiến dịch trực thuộc.");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Vui lòng chọn thời gian bắt đầu và kết thúc.");
      return;
    }
    if (endDate <= startDate) {
      toast.error("Thời gian kết thúc phải diễn ra sau thời gian bắt đầu.");
      return;
    }

    setIsSubmitting(true);
    try {
      const startIso = startDate.toISOString();
      const endIso = endDate.toISOString();

      if (editingActivity) {
        await toast.promise(
          activityApi.update(editingActivity.id, {
            id: editingActivity.id,
            name,
            description: description || null,
            startTime: startIso,
            endTime: endIso,
            capacity: capacity ? Number(capacity) : 50,
            creditDays: Number(creditDays),
            status: selectedStatus.value,
            locations,
          }),
          {
            loading: "Đang cập nhật hoạt động...",
            success: "Cập nhật hoạt động thành công!",
            error: (err) =>
              axios.isAxiosError(err)
                ? err.response?.data?.message ||
                  err.response?.data?.detail ||
                  "Không thể cập nhật hoạt động."
                : "Lỗi kết nối máy chủ.",
          },
        );
      } else {
        await toast.promise(
          activityApi.create({
            campaignId: selectedCampaign!.id,
            name,
            description: description || null,
            startTime: startIso,
            endTime: endIso,
            capacity: capacity ? Number(capacity) : 50,
            creditDays: Number(creditDays),
            locations,
          }),
          {
            loading: "Đang tạo hoạt động mới...",
            success: "Tạo hoạt động thành công!",
            error: (err) =>
              axios.isAxiosError(err)
                ? err.response?.data?.message ||
                  err.response?.data?.detail ||
                  "Không thể tạo hoạt động."
                : "Lỗi kết nối máy chủ.",
          },
        );
      }

      setIsFormOpen(false);
      onRefresh();
    } catch {
      // Handled by toast.promise
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (act: Activity) => {
    setDeletingActivity(act);
  };

  const handleConfirmDelete = async () => {
    if (!deletingActivity) return;
    try {
      await toast.promise(activityApi.remove(deletingActivity.id), {
        loading: "Đang xóa hoạt động...",
        success: "Đã xóa hoạt động.",
        error: (err) =>
          axios.isAxiosError(err)
            ? err.response?.data?.message ||
              err.response?.data?.detail ||
              "Không thể xóa hoạt động (chỉ xóa được khi chưa có dữ liệu ràng buộc)."
            : "Lỗi kết nối máy chủ.",
      });
      setDeletingActivity(null);
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
              Danh sách Hoạt động Tình nguyện ({activities.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quản lý thời gian, chỉ tiêu, điểm tọa độ GPS Geofence và xét duyệt
              Tình nguyện viên đăng ký.
            </p>
          </div>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            Tạo Hoạt động mới
          </Button>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Tên hoạt động & Chiến dịch</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Chỉ tiêu & Tín chỉ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <AdminTableRowSkeleton columns={6} />
                ) : activities.length > 0 ? (
                  activities.map((act) => {
                    const statusCfg = getActivityStatusConfig(act.status);
                    return (
                      <TableRow key={act.id}>
                        <TableCell className="max-w-64">
                          <div className="font-semibold text-slate-900 truncate">
                            {act.name}
                          </div>
                          <div className="text-xs text-blue-700 truncate">
                            {act.campaignName}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-44 truncate">
                          {act.organizationName}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{formatDateTimeVN(act.startTime)}</div>
                          <div className="text-muted-foreground">
                            → {formatDateTimeVN(act.endTime)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>
                            Chỉ tiêu:{" "}
                            <strong>{act.capacity || "Không GH"}</strong>
                          </div>
                          <div className="text-emerald-700 font-medium">
                            +{act.creditDays} ngày
                          </div>
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
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                navigate(`/admin/activities/${act.id}/attendance`)
                              }
                              className="gap-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                              title="Điểm danh và danh sách tình nguyện viên"
                            >
                              <ScanFace className="size-3.5" />
                              Điểm danh
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => setReviewActivity(act)}
                              className="gap-1 text-blue-700 border-blue-200 hover:bg-blue-50"
                            >
                              <Users className="size-3.5" />
                              Duyệt ĐK
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => openEditModal(act)}
                              title="Chỉnh sửa hoạt động"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              onClick={() => handleDelete(act)}
                              className="text-rose-600 hover:text-rose-700"
                              title="Xóa hoạt động"
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
                      colSpan={6}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Chưa có hoạt động nào. Hãy bấm &ldquo;Tạo Hoạt động
                      mới&rdquo; để bắt đầu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog Tạo / Cập nhật Hoạt động */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingActivity
                ? "Cập nhật Hoạt động Tình nguyện"
                : "Tạo Hoạt động Tình nguyện mới"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập thông tin hoạt động, số ngày/giờ công và tìm kiếm / ghim
              tọa độ vùng điểm danh GPS Geofence trực tiếp trên bản đồ.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {!editingActivity && (
              <div className="space-y-1.5">
                <Label>Chiến dịch trực thuộc</Label>
                <Combobox<Campaign>
                  items={campaigns}
                  value={selectedCampaign}
                  onValueChange={(c) => {
                    setSelectedCampaign(c);
                    if (c) {
                      const nextTimes = getDefaultActivityTimesForCampaign(c);
                      setStartDate(new Date(nextTimes.start));
                      setEndDate(new Date(nextTimes.end));
                    }
                  }}
                  itemToStringValue={(c) => String(c.id)}
                  itemToStringLabel={(c) => c.name}
                >
                  <ComboboxInput
                    placeholder="Chọn chiến dịch..."
                    className="w-full"
                  />
                  <ComboboxContent>
                    <ComboboxEmpty>Chưa có chiến dịch nào.</ComboboxEmpty>
                    <ComboboxList>
                      {(c: Campaign) => (
                        <ComboboxItem key={c.id} value={c}>
                          {c.name} ({c.organizationName})
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                {selectedCampaign && (
                  <p className="text-xs text-blue-700 font-medium">
                    Khung thời gian chiến dịch: {selectedCampaign.startDate} →{" "}
                    {selectedCampaign.endDate}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Tên hoạt động</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Ra quân Chủ nhật xanh - Dọn vệ sinh khuôn viên khu B"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Mô tả nhiệm vụ</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả chi tiết công việc, trang phục áo xanh thanh niên, dụng cụ mang theo..."
                rows={3}
              />
            </div>

            <div className="grid grid-col-2 gap-3 ">
              <div className="space-y-1.5">
                <Label>Thời gian bắt đầu hoạt động *</Label>
                <DateTimePicker value={startDate} onChange={handleStartDateChange} />
              </div>
              <div className="space-y-1.5">
                <Label>Thời gian kết thúc hoạt động *</Label>
                <DateTimePicker value={endDate} onChange={handleEndDateChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Chỉ tiêu (TNV)</Label>
                <Input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ngày công (+Ngày)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={creditDays}
                  onChange={(e) => setCreditDays(e.target.value)}
                  required
                />
              </div>
            </div>

            {editingActivity && (
              <div className="space-y-1.5">
                <Label>Trạng thái hoạt động</Label>
                <Combobox<StatusOption>
                  items={ACTIVITY_STATUS_LIST}
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

            {/* Bản đồ Tương tác Tìm kiếm Địa điểm & Ghim Tọa độ GPS Geofence */}
            {locations.map((loc, idx) => (
              <LocationMapPicker
                key={idx}
                value={loc}
                onChange={(nextLoc) => {
                  const next = [...locations];
                  next[idx] = nextLoc;
                  setLocations(next);
                }}
              />
            ))}

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
                {isSubmitting
                  ? "Đang lưu..."
                  : editingActivity
                    ? "Lưu thay đổi"
                    : "Tạo hoạt động"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Duyệt danh sách TNV Đăng ký */}
      <AdminRegistrationsDialog
        activity={reviewActivity}
        open={Boolean(reviewActivity)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewActivity(null);
            onRefresh();
          }
        }}
      />

      {/* Hộp thoại xác nhận xóa chuẩn AlertDialog của dthu-kit */}
      <ConfirmDialog
        open={Boolean(deletingActivity)}
        onOpenChange={(open) => !open && setDeletingActivity(null)}
        title="Xác nhận xóa hoạt động?"
        description={
          deletingActivity
            ? `Bạn có chắc chắn muốn xóa hoạt động "${deletingActivity.name}"? Thao tác này sẽ xóa vĩnh viễn và không thể hoàn tác.`
            : undefined
        }
        confirmLabel="Xóa hoạt động"
        cancelLabel="Hủy"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
