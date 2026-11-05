import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import axios from "axios";
import {
  ArrowLeft,
  Award,
  Building2,
  Calendar,
  CheckCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Flag,
  Info,
  MapPin,
  Navigation,
  ScanFace,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

import { activityApi } from "@/api/activityApi";
import { attendanceApi } from "@/api/attendanceApi";
import { useAuth } from "@/context/AuthContext";
import type { Activity } from "@/types/volunteer.types";
import type {
  ActiveAttendanceSession,
  CheckInResult,
} from "@/types/attendance.types";
import { VolunteerCheckInModal } from "@/components/activities/VolunteerCheckInModal";
import {
  formatDateTimeVN,
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/ui/alert-dialog";
import huyHieuDoan from "@/assets/HuyHieuDoan.png";

export const DetailActivitiesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();
  const isVolunteer = hasRole(["VOLUNTEER"]);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [selectedLocationIndex, setSelectedLocationIndex] = useState(0);
  const [registrationStatus, setRegistrationStatus] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Active attendance session state (Step A)
  const [activeSession, setActiveSession] =
    useState<ActiveAttendanceSession | null>(null);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState(0);

  const fetchActiveSession = useCallback(async () => {
    if (!id || !isAuthenticated) return;
    try {
      const sess = await attendanceApi.getActiveSession(id);
      setActiveSession(sess);
      if (sess && sess.remainingSeconds > 0) {
        setSessionRemainingSeconds(sess.remainingSeconds);
      } else {
        setSessionRemainingSeconds(0);
      }
    } catch {
      setActiveSession(null);
      setSessionRemainingSeconds(0);
    }
  }, [id, isAuthenticated]);

  const fetchActivityAndStatus = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [actRes, myRegsRes] = await Promise.allSettled([
        activityApi.getById(id),
        isAuthenticated && isVolunteer
          ? activityApi.getMyRegistrations({ pageSize: 100 })
          : Promise.resolve({ items: [] }),
      ]);

      if (actRes.status === "fulfilled") {
        setActivity(actRes.value);
      } else {
        setActivity(null);
      }

      if (myRegsRes.status === "fulfilled") {
        const found = myRegsRes.value.items?.find((r) => r.activityId === id);
        setRegistrationStatus(found ? found.registrationStatus : null);
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết hoạt động:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id, isAuthenticated, isVolunteer]);

  useEffect(() => {
    fetchActivityAndStatus();
    fetchActiveSession();

    // Poll active session every 15s to react to admin opening/closing sessions
    const interval = setInterval(() => {
      fetchActiveSession();
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchActivityAndStatus, fetchActiveSession]);

  // Real-time second-by-second countdown for the active attendance window
  useEffect(() => {
    if (!activeSession || sessionRemainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setSessionRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchActiveSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession, sessionRemainingSeconds, fetchActiveSession]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCheckInSuccess = (_res: CheckInResult) => {
    setActiveSession((prev) => (prev ? { ...prev, hasAttended: true } : null));
    fetchActivityAndStatus();
    fetchActiveSession();
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.info(
        "Vui lòng đăng nhập tài khoản Tình nguyện viên để đăng ký tham gia hoạt động.",
      );
      navigate("/login");
      return;
    }

    if (!isVolunteer) {
      toast.warning(
        "Chỉ tài khoản Tình nguyện viên mới có thể đăng ký tham gia hoạt động.",
      );
      return;
    }

    if (!activity) return;

    setIsLoadingAction(true);
    try {
      await activityApi.register(activity.id);
      toast.success("Đăng ký tham gia hoạt động thành công!");
      await fetchActivityAndStatus();
    } catch (err: unknown) {
      let msg = "Không thể đăng ký hoạt động. Vui lòng thử lại sau.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        msg = data?.message || data?.detail || data?.title || msg;
      }
      toast.error(msg);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!activity) return;

    setIsLoadingAction(true);
    try {
      await activityApi.cancelRegistration(activity.id);
      toast.success("Hủy đăng ký hoạt động thành công.");
      await fetchActivityAndStatus();
    } catch (err: unknown) {
      let msg = "Không thể hủy đăng ký hoạt động.";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        msg = data?.message || data?.detail || data?.title || msg;
      }
      toast.error(msg);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Đã sao chép liên kết hoạt động vào bộ nhớ tạm!");
      } else {
        toast.info(window.location.href);
      }
    } catch {
      toast.info(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/70 py-8">
        <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-24" />
          </div>
          <Skeleton className="h-44 w-full rounded-2xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-80 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-slate-100 p-4 text-slate-500 mb-4">
          <Flag className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">
          Không tìm thấy hoạt động
        </h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-md">
          Hoạt động bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ khỏi hệ
          thống.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild variant="default">
            <Link to="/activities">Xem danh sách hoạt động</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isStarted = new Date() >= new Date(activity.startTime);
  const isEnded = new Date() >= new Date(activity.endTime);
  const isFull =
    activity.capacity && activity.capacity > 0
      ? activity.registeredCount >= activity.capacity
      : false;

  const canRegister =
    (activity.status === "OPEN" || activity.status === "PUBLISHED") &&
    !isStarted &&
    !isFull &&
    (!registrationStatus || registrationStatus === "CANCELLED");

  const canCancel =
    (registrationStatus === "REGISTERED" ||
      registrationStatus === "PENDING" ||
      registrationStatus === "APPROVED") &&
    !isStarted &&
    activity.status !== "ONGOING" &&
    activity.status !== "COMPLETED" &&
    activity.status !== "CANCELLED";

  const regBadge = getRegistrationStatusBadge(registrationStatus);

  const progressPercent =
    activity.capacity && activity.capacity > 0
      ? Math.min(
          100,
          Math.round((activity.registeredCount / activity.capacity) * 100),
        )
      : 0;

  const remainingSpots = activity.capacity
    ? Math.max(0, activity.capacity - activity.registeredCount)
    : null;

  const activeLocation =
    activity.locations && activity.locations.length > 0
      ? activity.locations[selectedLocationIndex] || activity.locations[0]
      : null;

  const primaryLocationName =
    activity.locations && activity.locations.length > 0
      ? activity.locations[0].name +
        (activity.locations.length > 1
          ? ` (+${activity.locations.length - 1} điểm)`
          : "")
      : "Khuôn viên Trường ĐH Đồng Tháp";

  const getHeroStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
      case "PUBLISHED":
        return {
          label: "Đang mở đăng ký",
          dotColor: "bg-emerald-400 animate-pulse",
          pillClass: "bg-emerald-500/20 text-emerald-300 border-emerald-400/40",
        };
      case "UPCOMING":
        return {
          label: "Sắp diễn ra",
          dotColor: "bg-sky-400",
          pillClass: "bg-sky-500/20 text-sky-300 border-sky-400/40",
        };
      case "ONGOING":
        return {
          label: "Đang diễn ra",
          dotColor: "bg-blue-400 animate-pulse",
          pillClass: "bg-blue-500/25 text-blue-200 border-blue-400/40",
        };
      case "COMPLETED":
        return {
          label: "Đã hoàn thành",
          dotColor: "bg-slate-400",
          pillClass: "bg-slate-700/60 text-slate-300 border-slate-600",
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          dotColor: "bg-rose-400",
          pillClass: "bg-rose-500/20 text-rose-300 border-rose-400/40",
        };
      case "DRAFT":
        return {
          label: "Bản nháp",
          dotColor: "bg-amber-400",
          pillClass: "bg-amber-500/20 text-amber-300 border-amber-400/40",
        };
      default:
        return {
          label: status,
          dotColor: "bg-slate-400",
          pillClass: "bg-slate-700/50 text-slate-300 border-slate-600",
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Thanh Điều Hướng Trên Cùng */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="-ml-2 gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <Link to="/activities">
                <ArrowLeft className="size-4" /> Quay lại danh sách
              </Link>
            </Button>
            <span className="hidden sm:inline text-slate-300">/</span>
            <span className="hidden sm:inline truncate max-w-xs font-medium text-slate-800">
              {activity.name}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="gap-1.5 text-xs sm:text-sm"
          >
            <Share2 className="size-3.5" /> Chia sẻ
          </Button>
        </div>

        {/* Thông báo Trạng Thái Đăng Ký Của Người Dùng (nếu đã đăng ký) */}
        {registrationStatus && regBadge && (
          <div
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border p-4 shadow-2xs ${
              registrationStatus === "APPROVED"
                ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                : registrationStatus === "REJECTED"
                  ? "border-rose-200 bg-rose-50/70 text-rose-900"
                  : registrationStatus === "CANCELLED"
                    ? "border-slate-200 bg-slate-100/70 text-slate-800"
                    : "border-amber-200 bg-amber-50/70 text-amber-900"
            }`}
          >
            <div className="flex items-center gap-3">
              {registrationStatus === "APPROVED" ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
              ) : registrationStatus === "REJECTED" ? (
                <XCircle className="size-5 shrink-0 text-rose-600" />
              ) : registrationStatus === "CANCELLED" ? (
                <Info className="size-5 shrink-0 text-slate-600" />
              ) : (
                <Clock className="size-5 shrink-0 text-amber-600 animate-pulse" />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Trạng thái hồ sơ của bạn:
                  </span>
                  <Badge variant="outline" className={regBadge.className}>
                    {regBadge.label}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs sm:text-sm font-medium">
                  {registrationStatus === "APPROVED"
                    ? "Hồ sơ của bạn đã được duyệt tham gia! Vui lòng có mặt đúng giờ và điểm danh GPS tại điểm tập kết."
                    : registrationStatus === "REJECTED"
                      ? "Rất tiếc, hồ sơ của bạn chưa đủ điều kiện hoặc chỉ tiêu tuyển chọn đã đủ."
                      : registrationStatus === "CANCELLED"
                        ? "Bạn đã hủy đăng ký hoạt động này."
                        : "Hồ sơ đã gửi thành công và đang được Ban tổ chức xét duyệt. Vui lòng theo dõi thông báo."}
                </p>
              </div>
            </div>

            {canCancel && (
              <Button
                variant="outline"
                size="sm"
                className="border-amber-300 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0 text-xs"
                onClick={() => setIsCancelConfirmOpen(true)}
                disabled={isLoadingAction}
              >
                Hủy đăng ký
              </Button>
            )}
          </div>
        )}

        {/* Banner Điểm danh Trực tiếp (Step A) */}
        {activeSession && sessionRemainingSeconds > 0 && (
          <div
            className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-lg transition-all ${
              activeSession.hasAttended
                ? "border-emerald-500/40 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white"
                : "border-rose-500/40 bg-gradient-to-r from-slate-950 via-rose-950 to-amber-950 text-white shadow-rose-950/20"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-xl shadow-md ${
                    activeSession.hasAttended
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                  }`}
                >
                  {activeSession.hasAttended ? (
                    <CheckCheck className="size-6 text-emerald-400" />
                  ) : (
                    <ScanFace className="size-6 text-rose-400 animate-pulse" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="relative flex size-2.5">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          activeSession.hasAttended
                            ? "bg-emerald-400"
                            : "bg-rose-400"
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full size-2.5 ${
                          activeSession.hasAttended
                            ? "bg-emerald-500"
                            : "bg-rose-500"
                        }`}
                      />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Phiên điểm danh trực tiếp
                    </span>
                    <Badge
                      className={`text-[11px] font-bold ${
                        activeSession.type === "CHECK_IN"
                          ? "bg-blue-500/20 text-blue-200 border-blue-400/40"
                          : "bg-purple-500/20 text-purple-200 border-purple-400/40"
                      }`}
                    >
                      {activeSession.type === "CHECK_IN"
                        ? "ĐIỂM DANH VÀO"
                        : "ĐIỂM DANH RA"}
                    </Badge>
                  </div>

                  <p className="text-sm font-semibold text-white">
                    {activeSession.hasAttended
                      ? "Bạn đã hoàn thành điểm danh cho phiên này."
                      : "Ban tổ chức đang mở cổng điểm danh! Vui lòng xác thực GPS và chụp ảnh khuôn mặt selfie."}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Clock className="size-3.5 text-amber-400" />
                    <span>Thời gian mở cổng còn lại:</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      {formatCountdown(sessionRemainingSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2.5">
                {activeSession.hasAttended ? (
                  <Badge className="bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 px-3.5 py-1.5 text-xs font-semibold gap-1.5">
                    <CheckCircle2 className="size-4 text-emerald-400" />
                    Đã điểm danh hợp lệ
                  </Badge>
                ) : (
                  <Button
                    onClick={() => setIsCheckInModalOpen(true)}
                    size="default"
                    className="bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold shadow-lg gap-2 cursor-pointer transition-all transform hover:scale-[1.02]"
                  >
                    <ScanFace className="size-4" />
                    Điểm danh ngay (GPS + Khuôn mặt)
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Card Đầu Trang */}
        <Card className="relative overflow-hidden rounded-2xl border border-blue-900/40 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
          {/* Hiệu ứng ánh sáng nền & Huy hiệu chìm */}
          <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 size-80 rounded-full bg-indigo-500/15 blur-3xl" />
          <img
            src={huyHieuDoan}
            alt=""
            className="pointer-events-none absolute -bottom-10 -right-6 size-64 object-contain opacity-10 select-none"
          />

          <div className="relative z-10 space-y-6">
            {/* Hàng 1: Trạng thái, Chiến dịch & Quyền lợi TNV */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Trạng thái hoạt động */}
                {(() => {
                  const heroStatus = getHeroStatusBadge(activity.status);
                  return (
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md ${heroStatus.pillClass}`}
                    >
                      <span
                        className={`size-2 rounded-full ${heroStatus.dotColor}`}
                      />
                      {heroStatus.label}
                    </span>
                  );
                })()}

                {/* Tên chiến dịch cha (nếu có) */}
                {activity.campaignName && (
                  <Link
                    to="/campaigns"
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200 backdrop-blur-md transition-colors hover:border-blue-400/40 hover:bg-blue-500/20 hover:text-white"
                  >
                    <Flag className="size-3 text-blue-400" />
                    <span>Chiến dịch:</span>
                    <strong className="text-white">
                      {activity.campaignName}
                    </strong>
                  </Link>
                )}
              </div>

              {/* Huy hiệu quyền lợi nổi bật */}
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-200 backdrop-blur-md shadow-xs">
                <Award className="size-4 text-amber-400 shrink-0" />
                <span>+{activity.creditDays} ngày CTXH</span>
                <span className="text-amber-400/50">•</span>
                <span>{activity.creditHours} giờ rèn luyện</span>
              </div>
            </div>

            {/* Hàng 2: Tên hoạt động nổi bật */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight text-white drop-shadow-xs">
                {activity.name}
              </h1>
            </div>

            {/* Hàng 3: Đơn vị tổ chức & Tóm tắt nhanh thông tin */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-t border-white/10 pt-4">
              {/* Đơn vị tổ chức */}
              <div className="flex items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white p-1 shadow-md">
                  <img
                    src={huyHieuDoan}
                    alt={activity.organizationName}
                    className="size-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-blue-300">
                    Đơn vị tổ chức
                  </p>
                  <p className="flex items-center gap-1.5 font-bold text-white text-sm sm:text-base">
                    {activity.organizationName}
                    <CheckCircle2 className="size-4 text-amber-400 fill-amber-400/20" />
                  </p>
                </div>
              </div>

              {/* 3 Thẻ thống kê nhanh */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
                {/* Thời gian */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-blue-100 backdrop-blur-xs">
                  <Calendar className="size-4 text-blue-300 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-blue-300 font-medium">
                      Bắt đầu
                    </p>
                    <p className="font-semibold text-white truncate">
                      {formatDateTimeVN(activity.startTime)}
                    </p>
                  </div>
                </div>

                {/* Địa điểm */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-blue-100 backdrop-blur-xs">
                  <MapPin className="size-4 text-rose-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-blue-300 font-medium">
                      Địa điểm
                    </p>
                    <p
                      className="font-semibold text-white truncate max-w-[150px] sm:max-w-[180px]"
                      title={primaryLocationName}
                    >
                      {primaryLocationName}
                    </p>
                  </div>
                </div>

                {/* Chỉ tiêu */}
                <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-blue-100 backdrop-blur-xs">
                  <Users className="size-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-blue-300 font-medium">
                      Chỉ tiêu
                    </p>
                    <p className="font-semibold text-white truncate">
                      {activity.registeredCount}/
                      {activity.capacity
                        ? `${activity.capacity} TNV`
                        : "Không giới hạn"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Nội dung 2 Cột */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* CỘT TRÁI (2 Cột): Mô Tả, Quyền Lợi & Địa Điểm GPS */}
          <div className="space-y-6 lg:col-span-2">
            {/* 1. Mô tả chi tiết hoạt động */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900">
                  <FileText className="size-5 text-blue-600" />
                  Nội dung & Yêu cầu hoạt động
                </CardTitle>
                <CardDescription>
                  Thông tin giới thiệu chi tiết và kế hoạch triển khai của ban
                  tổ chức
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                {activity.description ? (
                  <div className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed text-slate-700 whitespace-pre-line">
                    {activity.description}
                  </div>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Chưa có thông tin mô tả chi tiết cho hoạt động này.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 2. Quyền lợi tình nguyện viên */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900">
                  <Award className="size-5 text-amber-500" />
                  Quyền lợi Tình nguyện viên
                </CardTitle>
                <CardDescription>
                  Chế độ ghi nhận ngày công tác xã hội và giờ rèn luyện sinh
                  viên ĐH Đồng Tháp
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="flex flex-col items-center justify-center rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-center">
                    <span className="text-2xl font-black text-blue-700">
                      +{activity.creditDays}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 mt-0.5">
                      Ngày tình nguyện
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Tính vào tiêu chí CTXH
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-center">
                    <span className="text-2xl font-black text-indigo-700">
                      +{activity.creditHours}
                    </span>
                    <span className="text-xs font-semibold text-slate-700 mt-0.5">
                      Giờ hoạt động
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Điểm rèn luyện sinh viên
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
                    <ShieldCheck className="size-8 text-emerald-600 mb-1" />
                    <span className="text-xs font-semibold text-slate-700">
                      Chứng nhận điện tử
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5">
                      Đoàn trường DThU cấp
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Vùng điểm danh GPS Geofencing */}
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold text-slate-900">
                    <MapPin className="size-5 text-rose-600" />
                    Vùng điểm danh GPS thông minh
                  </CardTitle>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    <Sparkles className="size-3 text-blue-600" />
                    {activity.locations?.length || 0} Điểm tập kết
                  </span>
                </div>
                <CardDescription>
                  Tình nguyện viên phải có mặt trong bán kính cho phép tại các
                  tọa độ sau để điểm danh
                </CardDescription>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-4">
                {activity.locations &&
                activity.locations.length > 0 &&
                activeLocation ? (
                  <>
                    {/* Bản đồ Google Maps nhúng */}
                    <div className="space-y-2">
                      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
                        <iframe
                          title={`Bản đồ ${activeLocation.name}`}
                          className="h-[280px] sm:h-[340px] w-full border-0"
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${activeLocation.latitude},${activeLocation.longitude}&hl=vi&z=16&output=embed`}
                        />
                        <div className="absolute top-3 right-3 flex max-w-[calc(100%-1.5rem)] items-center gap-1.5 rounded-lg border border-slate-200/80 bg-white/95 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm backdrop-blur-xs">
                          <MapPin className="size-3.5 shrink-0 text-rose-600" />
                          <span className="truncate font-semibold">
                            {activeLocation.name}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="shrink-0 font-medium text-blue-700">
                            Bán kính: {activeLocation.allowedRadiusMeters}m
                          </span>
                        </div>
                      </div>

                      {activity.locations.length > 1 && (
                        <p className="text-[12px] text-muted-foreground italic">
                          * Nhấp vào từng điểm tập kết bên dưới để chuyển góc
                          nhìn bản đồ.
                        </p>
                      )}
                    </div>

                    {/* Danh sách các điểm tập kết */}
                    <div className="space-y-3">
                      {activity.locations.map((loc, idx) => {
                        const isSelected = selectedLocationIndex === idx;
                        return (
                          <div
                            key={loc.id || idx}
                            onClick={() => setSelectedLocationIndex(idx)}
                            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition-all cursor-pointer ${
                              isSelected
                                ? "border-blue-500 bg-blue-50/40 ring-1 ring-blue-500/20 shadow-xs"
                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
                            }`}
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                    isSelected
                                      ? "bg-blue-600 text-white"
                                      : "bg-rose-100 text-rose-700"
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                                <h4 className="font-bold text-slate-900 truncate text-sm sm:text-base">
                                  {loc.name}
                                </h4>
                                {isSelected && (
                                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
                                    Đang xem
                                  </span>
                                )}
                              </div>
                              {loc.address && (
                                <p className="text-xs text-slate-600 pl-8">
                                  {loc.address}
                                </p>
                              )}
                              <p className="text-[11px] text-slate-500 font-mono pl-8">
                                Tọa độ: {loc.latitude.toFixed(6)},{" "}
                                {loc.longitude.toFixed(6)} • Bán kính cho phép:{" "}
                                <strong className="text-blue-700">
                                  {loc.allowedRadiusMeters}m
                                </strong>
                              </p>
                            </div>

                            {/* 2 nút: Chỉ đường & Xem vị trí */}
                            <div
                              className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0 shrink-0 self-start sm:self-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                asChild
                                variant="default"
                                size="sm"
                                className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs shadow-xs"
                              >
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Navigation className="size-3.5" />
                                  Chỉ đường
                                </a>
                              </Button>
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1.5 text-xs text-slate-700 border-slate-200 hover:bg-slate-100"
                              >
                                <a
                                  href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="size-3.5 text-slate-500" />
                                  Xem vị trí
                                </a>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="text-sm italic text-muted-foreground">
                    Chưa cập nhật tọa độ GPS cụ thể cho hoạt động này.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CỘT PHẢI (1 Cột): Sticky Panel Đăng Ký & Thông Tin Tiến Độ */}
          <div className="space-y-6">
            <Card className="sticky top-20 border-slate-200 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg font-bold text-slate-900">
                  Thông tin tham gia
                </CardTitle>
                <CardDescription>
                  Kiểm tra chỉ tiêu và tiến độ đăng ký của hoạt động
                </CardDescription>
              </CardHeader>
              <Separator />

              <CardContent className="space-y-4 pt-4 text-sm">
                {/* Tiến độ tuyển quân */}
                <div className="space-y-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Users className="size-4 text-blue-600" />
                      Chỉ tiêu tuyển dụng
                    </span>
                    <span className="text-slate-900">
                      <strong>{activity.registeredCount}</strong> /{" "}
                      {activity.capacity
                        ? `${activity.capacity} TNV`
                        : "Vô hạn"}
                    </span>
                  </div>

                  <Progress
                    aria-label="Tiến độ đăng ký"
                    value={progressPercent}
                    tone={isFull ? "destructive" : "primary"}
                  />

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Đã đạt {progressPercent}%</span>
                    <span>
                      {remainingSpots !== null
                        ? remainingSpots === 0
                          ? "Đã đủ chỉ tiêu"
                          : `Còn lại ${remainingSpots} suất`
                        : "Tuyển không giới hạn"}
                    </span>
                  </div>
                </div>

                {/* Khung thời gian chi tiết */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5">
                    <Calendar className="size-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Thời gian bắt đầu
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {formatDateTimeVN(activity.startTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="size-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Thời gian kết thúc
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {formatDateTimeVN(activity.endTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Building2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Đơn vị phụ trách
                      </p>
                      <p className="text-xs text-slate-600 font-medium">
                        {activity.organizationName}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Điểm danh trực tiếp trong Panel Hành động */}
                {activeSession && sessionRemainingSeconds > 0 && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50/70 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-rose-800 flex items-center gap-1.5">
                        <ScanFace className="size-4 text-rose-600 animate-pulse" />
                        {activeSession.type === "CHECK_IN"
                          ? "Điểm danh VÀO"
                          : "Điểm danh RA"}
                      </span>
                      <span className="font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-[11px]">
                        Còn {formatCountdown(sessionRemainingSeconds)}
                      </span>
                    </div>

                    {activeSession.hasAttended ? (
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-100/90 border border-emerald-300 px-3 py-2 text-xs font-semibold text-emerald-800">
                        <CheckCheck className="size-4 text-emerald-600 shrink-0" />
                        <span>Bạn đã điểm danh thành công!</span>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="default"
                        onClick={() => setIsCheckInModalOpen(true)}
                        className="w-full bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 font-bold text-white shadow-md gap-2"
                      >
                        <ScanFace className="size-4" />
                        Điểm danh ngay (GPS + Khuôn mặt)
                      </Button>
                    )}
                  </div>
                )}

                {/* Nút Hành Động Đăng Ký */}
                <div className="space-y-2 pt-1">
                  {canRegister ? (
                    <Button
                      type="button"
                      size="lg"
                      disabled={isLoadingAction}
                      onClick={handleRegister}
                      className="w-full bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-sm"
                    >
                      {isLoadingAction
                        ? "Đang xử lý..."
                        : isAuthenticated
                          ? "Đăng ký tham gia ngay"
                          : "Đăng nhập để đăng ký"}
                    </Button>
                  ) : canCancel ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      disabled={isLoadingAction}
                      onClick={() => setIsCancelConfirmOpen(true)}
                      className="w-full border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-semibold"
                    >
                      {isLoadingAction ? "Đang xử lý..." : "Hủy đăng ký"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      disabled
                      className="w-full cursor-not-allowed bg-slate-200 text-slate-500 font-semibold"
                    >
                      {isEnded
                        ? "Hoạt động đã kết thúc"
                        : isStarted
                          ? "Hoạt động đang diễn ra"
                          : isFull
                            ? "Đã đủ số lượng chỉ tiêu"
                            : registrationStatus === "APPROVED"
                              ? "Bạn đã được duyệt tham gia"
                              : registrationStatus === "PENDING" ||
                                  registrationStatus === "REGISTERED"
                                ? "Đang chờ ban tổ chức duyệt"
                                : "Chưa mở đăng ký"}
                    </Button>
                  )}

                  <p className="text-[11px] text-center text-muted-foreground">
                    Tuân thủ nội quy và điều lệ Tình nguyện viên DThU
                  </p>
                </div>

                {/* Lưu ý nhỏ */}
                <div className="rounded-lg bg-blue-50/60 p-3 text-xs text-slate-700 space-y-1.5 border border-blue-100">
                  <p className="font-semibold text-blue-900 flex items-center gap-1">
                    <Info className="size-3.5" /> Lưu ý quan trọng:
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-600">
                    <li>Có mặt trước 15 phút tại địa điểm tập kết.</li>
                    <li>Mặc trang phục chỉnh tề (áo Đoàn / áo đồng phục).</li>
                    <li>
                      Bật định vị GPS trên điện thoại để điểm danh hợp lệ.
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Điểm danh TNV (Step A) */}
      {activity && (
        <VolunteerCheckInModal
          activity={activity}
          activeSession={activeSession}
          open={isCheckInModalOpen}
          onOpenChange={setIsCheckInModalOpen}
          onSuccess={handleCheckInSuccess}
        />
      )}

      {/* Hộp thoại xác nhận hủy đăng ký */}
      <ConfirmDialog
        open={isCancelConfirmOpen}
        onOpenChange={setIsCancelConfirmOpen}
        title="Xác nhận hủy đăng ký hoạt động"
        description="Bạn có chắc chắn muốn hủy đăng ký tham gia hoạt động này? Bạn sẽ cần đăng ký lại nếu muốn tham gia sau này (trong thời gian hoạt động còn mở)."
        confirmLabel="Xác nhận hủy"
        cancelLabel="Giữ lại"
        variant="destructive"
        loading={isLoadingAction}
        onConfirm={handleCancelRegistration}
      />
    </div>
  );
};
