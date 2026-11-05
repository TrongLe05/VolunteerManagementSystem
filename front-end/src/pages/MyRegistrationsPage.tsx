import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import {
  Award,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  Flag,
  RefreshCw,
  ScanFace,
  XCircle,
} from "lucide-react";

import { activityApi } from "@/api/activityApi";
import { attendanceApi } from "@/api/attendanceApi";
import type { Activity, MyActivityRegistration } from "@/types/volunteer.types";
import type { ActiveAttendanceSession } from "@/types/attendance.types";
import {
  formatDateTimeVN,
  getActivityStatusConfig,
  getRegistrationStatusBadge,
} from "@/lib/activity-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import { RegistrationCardSkeleton } from "@/components/common/Skeletons";
import { AttendanceHistoryDialog } from "@/components/activities/AttendanceHistoryDialog";
import { VolunteerCheckInModal } from "@/components/activities/VolunteerCheckInModal";

export function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<MyActivityRegistration[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [cancellingActivity, setCancellingActivity] =
    useState<MyActivityRegistration | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Modal lịch sử & ảnh minh chứng điểm danh
  const [selectedHistoryReg, setSelectedHistoryReg] =
    useState<MyActivityRegistration | null>(null);

  // Modal điểm danh trực tiếp tại chỗ
  const [checkInActivity, setCheckInActivity] = useState<Activity | null>(null);
  const [activeSession, setActiveSession] =
    useState<ActiveAttendanceSession | null>(null);
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);

  const fetchMyRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await activityApi.getMyRegistrations({
        status: statusFilter || undefined,
        pageNumber: 1,
        pageSize: 50,
      });
      setRegistrations(res.items || []);
    } catch {
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchMyRegistrations();
  }, [fetchMyRegistrations]);

  const stats = useMemo(() => {
    const approved = registrations.filter(
      (r) => r.registrationStatus === "APPROVED",
    );
    const pending = registrations.filter(
      (r) =>
        r.registrationStatus === "REGISTERED" ||
        r.registrationStatus === "PENDING",
    );
    const totalDays = approved.reduce((sum, r) => sum + (r.creditDay || 0), 0);
    const totalHours = approved.reduce(
      (sum, r) => sum + (r.creditHour || 0),
      0,
    );
    const attendedCount = registrations.filter(
      (r) => r.attendances && r.attendances.length > 0,
    ).length;

    return {
      total: registrations.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      totalDays,
      totalHours,
      attendedCount,
    };
  }, [registrations]);

  const handleOpenCheckIn = async (activityId: string) => {
    try {
      const [act, session] = await Promise.all([
        activityApi.getById(activityId),
        attendanceApi.getActiveSession(activityId),
      ]);
      setCheckInActivity(act);
      setActiveSession(session);
      setIsCheckInOpen(true);
    } catch {
      toast.error("Không thể tải thông tin hoạt động để điểm danh.");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancellingActivity) return;
    setIsCancelling(true);
    try {
      await activityApi.cancelRegistration(cancellingActivity.activityId);
      toast.success("Đã hủy đăng ký hoạt động thành công.");
      setCancellingActivity(null);
      fetchMyRegistrations();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        const msg =
          data?.message ||
          data?.detail ||
          "Không thể hủy đăng ký hoạt động này.";
        toast.error(msg);
      } else {
        toast.error("Đã xảy ra lỗi khi hủy đăng ký. Vui lòng thử lại sau.");
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Tiêu đề & Làm mới */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold text-slate-900">
              <ClipboardCheck className="size-7 text-blue-600" />
              Hoạt động Tình nguyện của tôi
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý lịch trình, tương tác điểm danh GPS & FaceID, theo dõi minh chứng ảnh chụp hiện trường và tích lũy ngày CTXH.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMyRegistrations}
            className="gap-1.5 self-start sm:self-auto shadow-2xs hover:border-blue-300 cursor-pointer"
          >
            <RefreshCw className="size-4 text-blue-600" />
            Làm mới
          </Button>
        </div>

        {/* Thẻ Thống kê nhanh */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-slate-200/90 bg-white shadow-2xs">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Đã đăng ký</p>
              <p className="mt-1 text-2xl font-black text-slate-900">
                {stats.total}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/90 bg-white shadow-2xs">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Đã duyệt tham gia</p>
              <p className="mt-1 text-2xl font-black text-emerald-600">
                {stats.approvedCount}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/90 bg-white shadow-2xs">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">Đã có minh chứng điểm danh</p>
              <p className="mt-1 text-2xl font-black text-indigo-600">
                {stats.attendedCount}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200/90 bg-white shadow-2xs">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground">
                Tổng tích lũy dự kiến
              </p>
              <p className="mt-1 text-xl font-black text-blue-600">
                {stats.totalDays} ngày ({stats.totalHours}h)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Thanh lọc trạng thái đăng ký */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: "", label: "Tất cả" },
            { value: "APPROVED", label: "Đã duyệt" },
            { value: "REGISTERED", label: "Chờ duyệt" },
            { value: "REJECTED", label: "Từ chối" },
            { value: "CANCELLED", label: "Đã hủy" },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                statusFilter === tab.value
                  ? "bg-blue-600 text-white shadow-xs font-semibold"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh sách các hoạt động đã đăng ký */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <RegistrationCardSkeleton key={i} />
            ))}
          </div>
        ) : registrations.length > 0 ? (
          <div className="space-y-4">
            {registrations.map((item) => {
              const regBadge = getRegistrationStatusBadge(
                item.registrationStatus,
              );
              const actBadge = getActivityStatusConfig(item.activityStatus);
              const isStarted = new Date() >= new Date(item.startTime);
              const canCancel =
                (item.registrationStatus === "REGISTERED" ||
                  item.registrationStatus === "PENDING" ||
                  item.registrationStatus === "APPROVED") &&
                !isStarted &&
                item.activityStatus !== "ONGOING" &&
                item.activityStatus !== "COMPLETED" &&
                item.activityStatus !== "CANCELLED";

              const attendances = item.attendances || [];
              const hasAttendances = attendances.length > 0;
              const hasCheckIn = attendances.some(
                (a) => a.sessionType === "CHECK_IN" || a.sessionType?.toUpperCase().includes("IN"),
              );
              const hasCheckOut = attendances.some(
                (a) => a.sessionType === "CHECK_OUT" || a.sessionType?.toUpperCase().includes("OUT"),
              );

              return (
                <Card
                  key={item.registrationId}
                  className="overflow-hidden border-slate-200/90 bg-white shadow-xs hover:border-blue-200/90 transition-all"
                >
                  <CardHeader className="flex flex-col justify-between gap-3 pb-3 sm:flex-row sm:items-start">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-blue-700">
                          {item.organizationName}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                          <Flag className="size-3 text-amber-500" />
                          {item.campaignName}
                        </span>
                      </div>

                      <CardTitle className="text-base sm:text-lg font-bold text-slate-900 hover:text-blue-600 transition-colors">
                        <Link to={`/activities/${item.activityId}`}>
                          {item.activityName}
                        </Link>
                      </CardTitle>

                      <CardDescription className="text-xs text-slate-500">
                        Đăng ký tham gia lúc: {formatDateTimeVN(item.registeredAt)}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                      <Badge variant="outline" className={actBadge.className}>
                        {actBadge.label}
                      </Badge>
                      {regBadge && (
                        <Badge variant="outline" className={regBadge.className}>
                          {regBadge.label}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  {/* Thanh tiến trình & trạng thái điểm danh */}
                  <div className="mx-6 mb-3 rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        {/* Ảnh đại diện selfie nhỏ nếu đã có ảnh điểm danh */}
                        {attendances[0]?.capturedImageUrl ? (
                          <div
                            onClick={() => setSelectedHistoryReg(item)}
                            className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 border-indigo-400 shadow-2xs hover:opacity-90 transition-opacity"
                            title="Bấm để xem ảnh selfie điểm danh"
                          >
                            <img
                              src={attendances[0].capturedImageUrl}
                              alt="Minh chứng selfie"
                              className="size-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10" />
                          </div>
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shadow-2xs">
                            <ScanFace className="size-5" />
                          </div>
                        )}

                        <div className="min-w-0 flex-1 text-xs">
                          <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                            Trạng thái điểm danh:
                            {hasCheckIn && hasCheckOut ? (
                              <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="size-3.5 text-emerald-600" />
                                Đã hoàn thành 2/2 lượt
                              </span>
                            ) : hasCheckIn ? (
                              <span className="text-blue-700 font-bold inline-flex items-center gap-1">
                                <Clock className="size-3.5 text-blue-600" />
                                Đã Check-in vào (Chưa Check-out)
                              </span>
                            ) : (
                              <span className="text-amber-700 font-medium">
                                Chưa thực hiện điểm danh
                              </span>
                            )}
                          </p>

                          <p className="mt-0.5 text-[11px] text-muted-foreground truncate">
                            {hasAttendances
                              ? `Đã lưu ${attendances.length} bản ghi xác thực GPS & khuôn mặt AI.`
                              : "Yêu cầu có mặt trong vùng GPS Geofence khi ban tổ chức mở phiên."}
                          </p>
                        </div>
                      </div>

                      {/* Nút xem lịch sử điểm danh & ảnh selfie */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedHistoryReg(item)}
                        className="gap-1.5 border-blue-200 bg-white text-xs font-semibold text-blue-700 shadow-2xs hover:bg-blue-50 hover:border-blue-300 cursor-pointer shrink-0"
                      >
                        <Camera className="size-3.5 text-blue-600" />
                        <span>Xem Lịch sử & Ảnh selfie</span>
                      </Button>
                    </div>
                  </div>

                  {/* Thanh chân thẻ: thời gian, điểm tích lũy & các nút thao tác */}
                  <CardContent className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/40 py-3 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Calendar className="size-3.5 text-blue-600" />
                        {formatDateTimeVN(item.startTime)} →{" "}
                        {formatDateTimeVN(item.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700">
                        <Award className="size-3.5" />+{item.creditDay} ngày (
                        <Clock className="size-3" /> {item.creditHour} giờ)
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      {/* Nút điểm danh nhanh nếu đang diễn ra */}
                      {item.activityStatus === "ONGOING" &&
                        item.registrationStatus === "APPROVED" && (
                          <Button
                            size="sm"
                            onClick={() => handleOpenCheckIn(item.activityId)}
                            className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-xs hover:from-blue-700 hover:to-indigo-700 text-xs h-8.5 rounded-lg cursor-pointer"
                          >
                            <ScanFace className="size-4" />
                            <span>Điểm danh ngay</span>
                          </Button>
                        )}

                      {/* Nút liên kết chi tiết */}
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8.5 text-xs font-medium border-slate-200 gap-1 hover:border-blue-300"
                      >
                        <Link to={`/activities/${item.activityId}`}>
                          <ExternalLink className="size-3.5 text-slate-500" />
                          <span>Chi tiết</span>
                        </Link>
                      </Button>

                      {/* Nút Hủy đăng ký */}
                      {canCancel && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCancellingActivity(item)}
                          className="h-8.5 gap-1.5 text-xs font-medium shadow-2xs cursor-pointer"
                        >
                          <XCircle className="size-3.5" />
                          Hủy đăng ký
                        </Button>
                      )}

                      {!canCancel &&
                        isStarted &&
                        (item.registrationStatus === "REGISTERED" ||
                          item.registrationStatus === "APPROVED") && (
                          <span className="text-[11px] text-muted-foreground italic">
                            Hoạt động đã diễn ra
                          </span>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-slate-200 bg-white py-14 text-center">
            <CardContent className="space-y-3">
              <CheckCircle2 className="mx-auto size-10 text-slate-300" />
              <p className="font-semibold text-slate-900">
                Bạn chưa đăng ký hoạt động nào ở mục này
              </p>
              <p className="text-xs text-muted-foreground">
                Hãy khám phá Bảng tin Trang chủ hoặc danh mục Hoạt động để đăng
                ký tham gia nhé!
              </p>
              <Button
                size="sm"
                asChild
                className="bg-blue-600 text-white hover:bg-blue-700 font-semibold"
              >
                <Link to="/activities">Khám phá Hoạt động ngay</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal xem lịch sử điểm danh, thông số GPS và ảnh selfie hiện trường */}
      <AttendanceHistoryDialog
        registration={selectedHistoryReg}
        open={Boolean(selectedHistoryReg)}
        onOpenChange={(open) => {
          if (!open) setSelectedHistoryReg(null);
        }}
        onCheckInClick={(actId) => handleOpenCheckIn(actId)}
      />

      {/* Modal thực hiện điểm danh GPS & FaceID trực tiếp */}
      {checkInActivity && (
        <VolunteerCheckInModal
          activity={checkInActivity}
          activeSession={activeSession}
          open={isCheckInOpen}
          onOpenChange={(open) => {
            setIsCheckInOpen(open);
            if (!open) {
              setCheckInActivity(null);
              setActiveSession(null);
            }
          }}
          onSuccess={() => {
            setIsCheckInOpen(false);
            setCheckInActivity(null);
            setActiveSession(null);
            fetchMyRegistrations();
            toast.success("Điểm danh thành công! Minh chứng đã được lưu lại.");
          }}
        />
      )}

      {/* Dialog xác nhận hủy đăng ký */}
      <ConfirmDialog
        open={Boolean(cancellingActivity)}
        onOpenChange={(open) => {
          if (!open) setCancellingActivity(null);
        }}
        title="Xác nhận hủy đăng ký hoạt động?"
        description={`Bạn có chắc chắn muốn hủy đăng ký tham gia hoạt động "${cancellingActivity?.activityName}" không? Sau khi hủy, nếu còn chỉ tiêu bạn vẫn có thể đăng ký lại.`}
        confirmLabel={isCancelling ? "Đang hủy..." : "Hủy đăng ký"}
        cancelLabel="Giữ lại"
        variant="destructive"
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
