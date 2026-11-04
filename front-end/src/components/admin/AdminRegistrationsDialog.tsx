import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { CheckCircle2, Loader2, Search, Users, XCircle } from "lucide-react";

import type {
  Activity,
  ActivityRegistrationItem,
} from "@/types/volunteer.types";
import { activityApi } from "@/api/activityApi";
import {
  formatDateTimeVN,
  getRegistrationStatusBadge,
} from "@/lib/activity-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { toast } from "@/components/ui/toaster";

interface AdminRegistrationsDialogProps {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminRegistrationsDialog({
  activity,
  open,
  onOpenChange,
}: AdminRegistrationsDialogProps) {
  const [registrations, setRegistrations] = useState<
    ActivityRegistrationItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRegistrations = useCallback(async () => {
    if (!activity) return;
    setIsLoading(true);
    try {
      const res = await activityApi.getRegistrations(activity.id, {
        searchTerm: searchTerm.trim() || undefined,
        status: statusFilter || undefined,
        pageNumber: 1,
        pageSize: 100,
      });
      setRegistrations(res.items || []);
    } catch {
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  }, [activity, searchTerm, statusFilter]);

  useEffect(() => {
    if (open && activity) {
      fetchRegistrations();
    }
  }, [open, activity, fetchRegistrations]);

  useDashboardRealtime({
    onActivityChanged: () => {
      if (open && activity) {
        fetchRegistrations();
      }
    },
  });

  const handleReview = async (
    registrationId: string,
    status: "APPROVED" | "REJECTED",
  ) => {
    if (!activity) return;
    setProcessingId(registrationId);
    try {
      await activityApi.reviewRegistration(activity.id, registrationId, status);
      toast.success(
        status === "APPROVED"
          ? "Đã duyệt tình nguyện viên tham gia!"
          : "Đã từ chối đơn đăng ký.",
      );
      fetchRegistrations();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const resData = err.response?.data;
        const msg =
          resData?.message ||
          resData?.detail ||
          "Không thể cập nhật trạng thái.";
        toast.error(msg);
      } else {
        toast.error("Lỗi kết nối máy chủ.");
      }
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="size-5 text-blue-600" />
            Danh sách Đăng ký: {activity?.name}
          </DialogTitle>
          <DialogDescription>
            Xét duyệt hoặc từ chối đơn đăng ký tham gia hoạt động của Tình
            nguyện viên ({registrations.length} hồ sơ).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Họ tên, MSSV, Mã TNV..."
              className="pl-9 h-8"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { value: "", label: "Tất cả" },
              { value: "REGISTERED", label: "Chờ duyệt" },
              { value: "APPROVED", label: "Đã duyệt" },
              { value: "REJECTED", label: "Từ chối" },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setStatusFilter(tab.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="size-7 animate-spin text-blue-600" />
            <p className="text-xs text-muted-foreground">
              Đang tải danh sách tình nguyện viên đăng ký...
            </p>
          </div>
        ) : registrations.length > 0 ? (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Tình nguyện viên</TableHead>
                  <TableHead>MSSV / Lớp</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Thời gian ĐK</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác duyệt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => {
                  const badge = getRegistrationStatusBadge(reg.status);
                  const isBusy = processingId === reg.id;
                  return (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <div className="font-semibold text-slate-900">
                          {reg.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {reg.volunteerCode}{" "}
                          {reg.phone ? `• ${reg.phone}` : ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{reg.studentCode || "—"}</div>
                        <div className="text-muted-foreground">
                          {reg.className || ""}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs max-w-40 truncate">
                        {reg.organizationName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTimeVN(reg.registeredAt)}
                      </TableCell>
                      <TableCell>
                        {badge ? (
                          <Badge variant="outline" className={badge.className}>
                            {badge.label}
                          </Badge>
                        ) : (
                          <Badge variant="outline">{reg.status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {reg.status !== "APPROVED" &&
                            reg.status !== "CANCELLED" && (
                              <Button
                                size="xs"
                                disabled={isBusy}
                                onClick={() => handleReview(reg.id, "APPROVED")}
                                className="bg-emerald-600 text-white hover:bg-emerald-700 gap-1"
                              >
                                <CheckCircle2 className="size-3.5" />
                                Duyệt
                              </Button>
                            )}
                          {reg.status !== "REJECTED" &&
                            reg.status !== "CANCELLED" && (
                              <Button
                                size="xs"
                                variant="destructive"
                                disabled={isBusy}
                                onClick={() => handleReview(reg.id, "REJECTED")}
                                className="gap-1"
                              >
                                <XCircle className="size-3.5" />
                                Từ chối
                              </Button>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            Chưa có tình nguyện viên nào đăng ký hoạt động này.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
