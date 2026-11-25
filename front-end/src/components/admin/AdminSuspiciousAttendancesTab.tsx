import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import type { SuspiciousAttendanceItem } from "@/types/attendance.types";
import { attendanceApi } from "@/api/attendanceApi";
import { formatDateTimeVN } from "@/lib/activity-helpers";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toaster";

const STATUS_TABS = [
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Đã từ chối" },
  { value: "ALL", label: "Tất cả" },
];

function getStatusBadge(status: string) {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium">
          Đã duyệt
        </Badge>
      );
    case "REJECTED":
      return (
        <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 font-medium">
          Đã từ chối
        </Badge>
      );
    default:
      return (
        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 font-medium">
          Chờ xử lý
        </Badge>
      );
  }
}

function getSessionBadge(type: string) {
  const isCheckIn = type?.toUpperCase() === "CHECK_IN";
  return (
    <Badge
      variant="outline"
      className={
        isCheckIn
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-purple-200 bg-purple-50 text-purple-700"
      }
    >
      {isCheckIn ? "Điểm danh vào" : "Điểm danh ra"}
    </Badge>
  );
}

function getMapsUrl(item: SuspiciousAttendanceItem) {
  if (item.latitude == null || item.longitude == null) return null;
  return `https://www.google.com/maps?q=${item.latitude},${item.longitude}`;
}

export function AdminSuspiciousAttendancesTab() {
  const [items, setItems] = useState<SuspiciousAttendanceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [selected, setSelected] = useState<SuspiciousAttendanceItem | null>(
    null,
  );
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState<"APPROVED" | "REJECTED" | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await attendanceApi.getSuspicious({
        status: statusFilter,
        searchTerm: searchTerm.trim() || undefined,
        pageNumber: page,
        pageSize,
      });
      setItems(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error("Không thể tải danh sách điểm danh nghi vấn.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, searchTerm, page, pageSize]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 250);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useDashboardRealtime({ onActivityChanged: fetchData });

  const openReview = (item: SuspiciousAttendanceItem) => {
    setSelected(item);
    setReviewNote("");
  };

  const closeReview = () => {
    if (processing) return;
    setSelected(null);
    setReviewNote("");
  };

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    if (status === "REJECTED" && !reviewNote.trim()) {
      toast.error("Vui lòng nhập lý do từ chối điểm danh.");
      return;
    }

    setProcessing(status);
    try {
      await attendanceApi.reviewSuspicious({
        attendanceId: selected.attendanceId,
        status,
        note: reviewNote.trim() || null,
      });
      toast.success(
        status === "APPROVED"
          ? "Đã duyệt điểm danh hợp lệ."
          : "Đã từ chối điểm danh.",
      );
      setSelected(null);
      setReviewNote("");
      fetchData();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        toast.error(
          data?.message ||
            data?.detail ||
            data?.title ||
            "Không thể cập nhật kết quả duyệt.",
        );
      } else {
        toast.error("Lỗi kết nối máy chủ.");
      }
    } finally {
      setProcessing(null);
    }
  };

  const isPendingSelected = selected?.status?.toUpperCase() === "PENDING";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <ShieldAlert className="size-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">
              Nghi vấn điểm danh
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Các lượt điểm danh ngoài bán kính GPS cho phép cần cán bộ đối chiếu
              ảnh selfie và vị trí để duyệt hoặc từ chối.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={isLoading}
          className="h-8 gap-1.5 text-xs self-end sm:self-auto"
        >
          <RefreshCw
            className={`size-3.5 ${isLoading ? "animate-spin text-primary" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* Bộ lọc */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(1);
                }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              placeholder="Tìm tên TNV, MSSV, tên hoạt động..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bảng */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b">
                <TableRow>
                  <TableHead className="text-xs font-semibold">
                    Tình nguyện viên
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Hoạt động & Phiên
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Bằng chứng
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-44 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
                        <Loader2 className="size-5 animate-spin text-primary" />
                        <span>Đang tải danh sách nghi vấn...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-44">
                      <EmptyState
                        icon={<ShieldAlert className="size-8 text-slate-400" />}
                        title="Không có ca điểm danh nghi vấn nào"
                        description={
                          statusFilter === "PENDING"
                            ? "Hiện không có lượt điểm danh nào đang chờ xử lý."
                            : "Không tìm thấy bản ghi khớp với bộ lọc hiện tại."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => {
                    const mapsUrl = getMapsUrl(item);
                    return (
                      <TableRow key={item.attendanceId}>
                        <TableCell>
                          <div className="font-semibold text-slate-900 text-sm">
                            {item.volunteerName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.studentCode || "Chưa có MSSV"}
                          </div>
                        </TableCell>

                        <TableCell className="max-w-64">
                          <div
                            className="font-medium text-slate-800 text-sm truncate"
                            title={item.activityName}
                          >
                            {item.activityName}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            {getSessionBadge(item.sessionType)}
                            <span className="flex items-center gap-1">
                              <Clock className="size-3" />
                              {formatDateTimeVN(item.attendedAt)}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            {item.capturedImageUrl ? (
                              <img
                                src={item.capturedImageUrl}
                                alt="Ảnh selfie điểm danh"
                                className="size-10 rounded-md object-cover border cursor-pointer"
                                onClick={() => openReview(item)}
                              />
                            ) : (
                              <div className="size-10 rounded-md border border-dashed bg-slate-50 flex items-center justify-center text-[10px] text-slate-400">
                                No img
                              </div>
                            )}
                            <div className="text-xs space-y-0.5">
                              <div
                                className="text-rose-600 font-medium max-w-56 truncate"
                                title={item.note || ""}
                              >
                                {item.note || "Ngoài vùng điểm danh"}
                              </div>
                              {mapsUrl && (
                                <a
                                  href={mapsUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  <MapPin className="size-3" />
                                  Xem trên bản đồ
                                </a>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          {getStatusBadge(item.status)}
                          {item.reviewerEmail && (
                            <div
                              className="mt-1 text-[11px] text-muted-foreground truncate max-w-40"
                              title={item.reviewerEmail}
                            >
                              bởi {item.reviewerEmail}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
                            onClick={() => openReview(item)}
                          >
                            <Eye className="size-3.5" />
                            {item.status?.toUpperCase() === "PENDING"
                              ? "Xem & duyệt"
                              : "Xem"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && items.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t bg-slate-50/40 text-xs text-slate-500">
              <div>
                Hiển thị{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min((page - 1) * pageSize + 1, totalCount)}
                </span>{" "}
                đến{" "}
                <span className="font-semibold text-slate-800">
                  {Math.min(page * pageSize, totalCount)}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-semibold text-slate-800">
                  {totalCount}
                </span>{" "}
                bản ghi
              </div>
              <Pagination
                page={page}
                pageCount={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog xem bằng chứng & duyệt */}
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) closeReview();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-600" />
              Xem xét điểm danh nghi vấn
            </DialogTitle>
            <DialogDescription>
              Đối chiếu ảnh selfie và vị trí GPS trước khi quyết định.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                {selected.capturedImageUrl ? (
                  <a
                    href={selected.capturedImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Mở ảnh gốc ở tab mới"
                  >
                    <img
                      src={selected.capturedImageUrl}
                      alt="Ảnh selfie điểm danh"
                      className="w-full max-h-80 rounded-lg border object-contain bg-slate-50"
                    />
                  </a>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed bg-slate-50 text-xs text-slate-400">
                    Không có ảnh selfie bằng chứng
                  </div>
                )}
              </div>

              <div className="space-y-2.5 text-sm">
                <div>
                  <div className="font-semibold text-slate-900">
                    {selected.volunteerName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selected.studentCode || "Chưa có MSSV"}
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-muted-foreground">Hoạt động: </span>
                    <strong>{selected.activityName}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Đơn vị: </span>
                    {selected.organizationName}
                  </div>
                  <div className="flex items-center gap-2">
                    {getSessionBadge(selected.sessionType)}
                    {getStatusBadge(selected.status)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Thời gian: </span>
                    {formatDateTimeVN(selected.attendedAt)}
                  </div>
                  {selected.locationAccuracyMeters != null && (
                    <div>
                      <span className="text-muted-foreground">
                        Độ chính xác GPS:{" "}
                      </span>
                      ±{Math.round(selected.locationAccuracyMeters)}m
                    </div>
                  )}
                  {getMapsUrl(selected) && (
                    <a
                      href={getMapsUrl(selected)!}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      Mở vị trí trên Google Maps
                    </a>
                  )}
                </div>
                <div className="rounded-md bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
                  {selected.note || "Ngoài vùng điểm danh"}
                </div>
                {!isPendingSelected && selected.reviewerEmail && (
                  <div className="text-xs text-muted-foreground">
                    Đã xử lý bởi {selected.reviewerEmail}
                    {selected.reviewedAt
                      ? ` lúc ${formatDateTimeVN(selected.reviewedAt)}`
                      : ""}
                  </div>
                )}
              </div>
            </div>
          )}

          {isPendingSelected && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Ghi chú của cán bộ{" "}
                <span className="text-muted-foreground font-normal">
                  (bắt buộc khi từ chối)
                </span>
              </label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="VD: Ảnh selfie đúng bối cảnh hiện trường, GPS bị trôi sóng trong nhà..."
                rows={3}
                disabled={Boolean(processing)}
              />
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={closeReview}
              disabled={Boolean(processing)}
            >
              Đóng
            </Button>
            {isPendingSelected && (
              <>
                <Button
                  variant="outline"
                  className="gap-1.5 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => handleReview("REJECTED")}
                  disabled={Boolean(processing)}
                >
                  {processing === "REJECTED" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <XCircle className="size-4" />
                  )}
                  Từ chối
                </Button>
                <Button
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => handleReview("APPROVED")}
                  disabled={Boolean(processing)}
                >
                  {processing === "APPROVED" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  Duyệt hợp lệ
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
