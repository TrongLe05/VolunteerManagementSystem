import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  Download,
  Play,
  RefreshCw,
  Search,
  StopCircle,
  Timer,
  UserCheck,
  Users,
} from "lucide-react";

import { attendanceApi } from "@/api/attendanceApi";
import type {
  ActivityAttendanceOverview,
  AttendanceSessionType,
} from "@/types/attendance.types";
import { formatDateTimeVN } from "@/lib/activity-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { toast } from "@/components/ui/toaster";

export function AdminActivityAttendancePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [overview, setOverview] =
    useState<ActivityAttendanceOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterMode, setFilterMode] = useState<
    "ALL" | "ATTENDED" | "CHECK_IN_ONLY" | "ABSENT"
  >("ALL");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Quick session state
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [customMinutes, setCustomMinutes] = useState<string>("5");
  const [showCustomDuration, setShowCustomDuration] = useState<boolean>(false);
  const [manualMarkingId, setManualMarkingId] = useState<string | null>(null);

  // Live Countdown ticker for active session
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const fetchOverview = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await attendanceApi.getActivityOverview(id);
      setOverview(res);
      if (res.activeSession?.remainingSeconds) {
        setRemainingSeconds(res.activeSession.remainingSeconds);
      } else {
        setRemainingSeconds(0);
      }
    } catch {
      toast.error("Không thể tải dữ liệu điểm danh của hoạt động");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  // Live countdown ticker
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          fetchOverview(); // re-fetch when session times out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSeconds, fetchOverview]);

  // Mở phiên điểm danh
  const handleOpenSession = async (
    type: AttendanceSessionType,
    minutes: number
  ) => {
    if (!id) return;
    try {
      setActionInProgress(true);
      await attendanceApi.openSession({
        activityId: id,
        type,
        durationMinutes: minutes,
      });
      toast.success(
        `Đã mở phiên ${type === "CHECK_IN" ? "Điểm danh VÀO" : "Điểm danh RA"} thành công (${minutes} phút)`
      );
      setShowCustomDuration(false);
      await fetchOverview();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { detail?: string; message?: string } };
      };
      toast.error(
        axiosErr.response?.data?.detail ||
          axiosErr.response?.data?.message ||
          "Không thể mở phiên điểm danh"
      );
    } finally {
      setActionInProgress(false);
    }
  };

  // Đóng phiên sớm
  const handleQuickCloseSession = async () => {
    if (!overview?.activeSession?.id) return;
    try {
      setActionInProgress(true);
      await attendanceApi.closeSession(overview.activeSession.id);
      toast.success("Đã đóng phiên điểm danh sớm thành công!");
      await fetchOverview();
    } catch {
      toast.error("Không thể đóng phiên điểm danh");
    } finally {
      setActionInProgress(false);
    }
  };

  // Cán bộ điểm danh thủ công
  const handleManualMark = async (
    registrationId: string,
    type: AttendanceSessionType
  ) => {
    try {
      setManualMarkingId(`${registrationId}-${type}`);
      await attendanceApi.manualMark({
        registrationId,
        type,
        note: `Cán bộ xác nhận thủ công lúc ${new Date().toLocaleTimeString("vi-VN")}`,
      });
      toast.success(
        `Đã điểm danh ${type === "CHECK_IN" ? "VÀO" : "RA"} cho sinh viên thành công!`
      );
      await fetchOverview();
    } catch {
      toast.error("Không thể xác nhận điểm danh thủ công");
    } finally {
      setManualMarkingId(null);
    }
  };

  const formatCountdown = (secs: number) => {
    if (secs <= 0) return "00:00 (Hết giờ)";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Export CSV danh sách điểm danh
  const handleExportCSV = () => {
    if (!overview || overview.volunteers.length === 0) {
      toast.error("Chưa có dữ liệu tình nguyện viên để xuất");
      return;
    }

    const headers = [
      "STT",
      "Họ và tên",
      "Mã số sinh viên",
      "Chi đoàn / Lớp",
      "Số điện thoại",
      "Trạng thái đăng ký",
      "Thời gian Check-in",
      "GPS Check-in",
      "Độ khớp ArcFace Check-in",
      "Thời gian Check-out",
      "GPS Check-out",
      "Độ khớp ArcFace Check-out",
      "Kết quả điểm danh",
    ];

    const rows = overview.volunteers.map((vol, idx) => {
      const hasIn = vol.checkIn !== null && vol.checkIn !== undefined;
      const hasOut = vol.checkOut !== null && vol.checkOut !== undefined;

      let resultText = "Vắng mặt";
      if (hasIn && hasOut) resultText = "Có mặt đủ (2 lần)";
      else if (hasIn) resultText = "Có mặt vào";
      else if (hasOut) resultText = "Có mặt ra";

      return [
        idx + 1,
        `"${vol.fullName}"`,
        `"${vol.studentCode || ""}"`,
        `"${vol.className || ""}"`,
        `"${vol.phone || ""}"`,
        `"${vol.registrationStatus}"`,
        hasIn && vol.checkIn ? `"${formatDateTimeVN(vol.checkIn.attendedAt)}"` : '""',
        hasIn && vol.checkIn ? `"${vol.checkIn.locationStatus}"` : '""',
        hasIn && vol.checkIn?.faceSimilarity ? `"${(vol.checkIn.faceSimilarity * 100).toFixed(1)}%"` : '""',
        hasOut && vol.checkOut ? `"${formatDateTimeVN(vol.checkOut.attendedAt)}"` : '""',
        hasOut && vol.checkOut ? `"${vol.checkOut.locationStatus}"` : '""',
        hasOut && vol.checkOut?.faceSimilarity ? `"${(vol.checkOut.faceSimilarity * 100).toFixed(1)}%"` : '""',
        `"${resultText}"`,
      ].join(",");
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `DiemDanh_${overview.activityName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã xuất danh sách điểm danh thành công!");
  };

  // Filtered volunteer list
  const filteredVolunteers = (overview?.volunteers || []).filter((v) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = v.fullName.toLowerCase().includes(q);
      const matchCode = v.studentCode?.toLowerCase().includes(q);
      const matchClass = v.className?.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchClass) return false;
    }

    if (filterMode === "ATTENDED") {
      return v.checkIn !== null && v.checkOut !== null;
    }
    if (filterMode === "CHECK_IN_ONLY") {
      return v.checkIn !== null && v.checkOut === null;
    }
    if (filterMode === "ABSENT") {
      return v.checkIn === null && v.checkOut === null;
    }

    return true;
  });

  const percentAttended =
    overview && overview.totalRegistered > 0
      ? Math.round((overview.totalAttended / overview.totalRegistered) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs & Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              to="/admin"
              className="hover:text-foreground transition-colors"
            >
              Dashboard
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <Link
              to="/admin/activities"
              className="hover:text-foreground transition-colors"
            >
              Hoạt động tình nguyện
            </Link>
            <ChevronRight className="size-3 text-muted-foreground/60" />
            <span className="font-semibold text-foreground">
              Điểm danh chi tiết
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => navigate("/admin/activities")}
              className="rounded-lg size-8 text-muted-foreground hover:text-foreground"
              title="Quay lại danh sách hoạt động"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground line-clamp-1">
              Quản lý Điểm danh:{" "}
              <span className="text-primary">
                {overview?.activityName || "Đang tải..."}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={loading}
            className="gap-1.5 text-xs h-9 cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span>Đồng bộ</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={loading || !overview}
            className="gap-1.5 text-xs h-9 border-slate-300 dark:border-slate-700 cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Xuất CSV</span>
          </Button>
        </div>
      </div>

      {/* 2. Hero Information Card of the Activity */}
      <Card className="border-border shadow-xs bg-card overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold"
                >
                  {overview?.campaignName || "Chiến dịch tình nguyện"}
                </Badge>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Building2 className="size-3.5 text-primary" />
                  {overview?.organizationName}
                </span>
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {overview?.activityName}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" />
                  <span>
                    Bắt đầu:{" "}
                    <strong className="text-foreground">
                      {overview?.startTime
                        ? formatDateTimeVN(overview.startTime)
                        : "-"}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span>
                    Kết thúc:{" "}
                    <strong className="text-foreground">
                      {overview?.endTime
                        ? formatDateTimeVN(overview.endTime)
                        : "-"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* GPS Geofence Quick Info */}
            <div className="rounded-xl border border-primary/15 bg-primary/5 p-3.5 text-xs text-muted-foreground lg:max-w-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <Compass className="size-4 text-primary" />
                <span>Bảo mật Vị trí GPS & ArcFace AI:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Hệ thống tự động so khớp tọa độ thiết bị với bán kính cho phép
                và trích xuất 512D khuôn mặt sinh trắc học để đảm bảo tính minh bạch.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Bốn Thẻ Thống kê KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Đã đăng ký */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Đã đăng ký (Duyệt)
              </p>
              <p className="text-2xl font-bold text-foreground">
                {overview?.totalRegistered ?? "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Đã điểm danh */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400 shrink-0">
              <UserCheck className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Đã điểm danh
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {overview?.totalAttended ?? "-"}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10px] font-bold px-1.5 py-0"
                >
                  {percentAttended}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Check-in Vào */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Check-in (Vào)
              </p>
              <p className="text-2xl font-bold text-foreground">
                {overview?.totalCheckedIn ?? "-"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Check-out Ra */}
        <Card className="border-border shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 shrink-0">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">
                Check-out (Ra)
              </p>
              <p className="text-2xl font-bold text-foreground">
                {overview?.totalCheckedOut ?? "-"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Thanh Điều Khiển Phiên Điểm Danh Trực Tiếp (Live Session Banner) */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        {overview?.activeSession && remainingSeconds > 0 ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-slate-900 via-primary/95 to-slate-900 rounded-xl p-4 text-white shadow-md">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="flex size-2.5 rounded-full bg-rose-500 animate-ping" />
                <Badge className="bg-rose-500 text-white font-bold text-xs px-2.5 py-0.5 tracking-wider">
                  🔴 PHIÊN ĐIỂM DANH ĐANG MỞ
                </Badge>
                <Badge
                  variant="outline"
                  className="border-white/30 text-white bg-white/10 text-xs font-semibold"
                >
                  {overview.activeSession.type === "CHECK_IN"
                    ? "Điểm danh VÀO (Check-in)"
                    : "Điểm danh RA (Check-out)"}
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Tình nguyện viên tại hiện trường mở ứng dụng, chụp ảnh khuôn mặt
                và đối soát GPS Geofence để điểm danh.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15">
              <div className="text-right pr-2">
                <span className="text-[10px] text-slate-300 uppercase tracking-wider font-semibold block">
                  Thời gian còn lại
                </span>
                <span className="text-3xl font-extrabold tracking-widest font-mono text-emerald-300">
                  {formatCountdown(remainingSeconds)}
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleQuickCloseSession}
                disabled={actionInProgress}
                className="bg-rose-600 hover:bg-rose-700 font-semibold text-xs h-9 cursor-pointer"
              >
                <StopCircle className="size-4 mr-1.5" />
                Đóng phiên sớm
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Timer className="size-4 text-primary" />
                <span>Kích hoạt Phiên Điểm Danh Trực Tiếp</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Mở phiên giới hạn thời gian (mặc định 5 phút). Tình nguyện viên
                sẽ có 5 phút để quét khuôn mặt và gửi tọa độ GPS xác thực.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleOpenSession("CHECK_IN", 5)}
                disabled={actionInProgress}
                className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-9 cursor-pointer"
              >
                <Play className="size-3.5 fill-current" />
                Mở Check-in Vào (5p)
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenSession("CHECK_OUT", 5)}
                disabled={actionInProgress}
                className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 text-xs font-semibold h-9 cursor-pointer"
              >
                <Play className="size-3.5 fill-current" />
                Mở Check-out Ra (5p)
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCustomDuration(!showCustomDuration)}
                className="text-xs text-muted-foreground hover:text-foreground h-9"
              >
                Tùy chỉnh số phút...
              </Button>
            </div>
          </div>
        )}

        {/* Khung nhập tùy chỉnh số phút khi cần */}
        {showCustomDuration && (!overview?.activeSession || remainingSeconds <= 0) && (
          <div className="mt-3 flex items-center gap-3 pt-3 border-t text-xs">
            <span className="font-medium text-foreground">Số phút muốn mở:</span>
            <Input
              type="number"
              min={1}
              max={1440}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="h-8 w-20 text-center text-xs"
            />
            <Button
              size="sm"
              onClick={() => {
                const mins = parseInt(customMinutes, 10);
                if (mins > 0) handleOpenSession("CHECK_IN", mins);
              }}
              disabled={actionInProgress}
              className="text-xs h-8"
            >
              Mở Check-in ({customMinutes}p)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const mins = parseInt(customMinutes, 10);
                if (mins > 0) handleOpenSession("CHECK_OUT", mins);
              }}
              disabled={actionInProgress}
              className="text-xs h-8"
            >
              Mở Check-out ({customMinutes}p)
            </Button>
          </div>
        )}
      </div>

      {/* 5. Danh Sách Tình Nguyện Viên Của Hoạt Động */}
      <Card className="border-border shadow-xs">
        <CardHeader className="p-4 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Danh sách Tình nguyện viên Hoạt động ({filteredVolunteers.length})
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Theo dõi kết quả điểm danh sinh trắc học và vị trí GPS của từng sinh viên.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={filterMode === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("ALL")}
                className="text-xs h-8"
              >
                Tất cả ({overview?.volunteers.length || 0})
              </Button>
              <Button
                variant={filterMode === "ATTENDED" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("ATTENDED")}
                className="text-xs h-8"
              >
                Đủ 2 lần ({overview?.volunteers.filter((v) => v.checkIn && v.checkOut).length || 0})
              </Button>
              <Button
                variant={filterMode === "CHECK_IN_ONLY" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("CHECK_IN_ONLY")}
                className="text-xs h-8"
              >
                Chỉ vào ({overview?.volunteers.filter((v) => v.checkIn && !v.checkOut).length || 0})
              </Button>
              <Button
                variant={filterMode === "ABSENT" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterMode("ABSENT")}
                className="text-xs h-8"
              >
                Vắng ({overview?.totalAbsent || 0})
              </Button>
            </div>
          </div>

          <div className="mt-3 relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo họ tên, MSSV, chi đoàn/lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-xs h-9"
            />
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12 text-center text-xs">STT</TableHead>
                <TableHead className="text-xs">Tình nguyện viên</TableHead>
                <TableHead className="text-xs">Điểm danh VÀO (Check-in)</TableHead>
                <TableHead className="text-xs">Điểm danh RA (Check-out)</TableHead>
                <TableHead className="text-xs">Đánh giá chung</TableHead>
                <TableHead className="text-xs text-right">Xác nhận thủ công</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <RefreshCw className="size-6 animate-spin text-primary" />
                      <span className="text-xs">Đang tải danh sách tình nguyện viên...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredVolunteers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Users className="size-8 text-muted-foreground/40" />
                      <p className="text-sm font-semibold">Không tìm thấy tình nguyện viên nào</p>
                      <p className="text-xs text-muted-foreground">
                        {searchTerm
                          ? "Không có sinh viên nào phù hợp với từ khóa tìm kiếm."
                          : "Hoạt động này chưa có sinh viên nào đăng ký."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVolunteers.map((vol, idx) => {
                  const hasCheckIn = vol.checkIn !== null && vol.checkIn !== undefined;
                  const hasCheckOut = vol.checkOut !== null && vol.checkOut !== undefined;

                  return (
                    <TableRow key={vol.registrationId} className="text-xs hover:bg-muted/30">
                      {/* STT */}
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {idx + 1}
                      </TableCell>

                      {/* Thông tin TNV */}
                      <TableCell>
                        <div>
                          <span className="font-semibold text-foreground block">
                            {vol.fullName}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {vol.studentCode || "Chưa có MSSV"}
                            {vol.className ? ` • ${vol.className}` : ""}
                          </span>
                          {vol.phone && (
                            <span className="text-[10px] text-muted-foreground/80 block">
                              SĐT: {vol.phone}
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Check-in */}
                      <TableCell>
                        {hasCheckIn && vol.checkIn ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-1.5 py-0">
                                <Check className="size-2.5" />
                                {formatDateTimeVN(vol.checkIn.attendedAt)}
                              </Badge>
                              {vol.checkIn.capturedImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhoto(vol.checkIn?.capturedImageUrl || null)}
                                  className="size-6 rounded border border-border overflow-hidden hover:ring-1 hover:ring-primary cursor-pointer"
                                  title="Xem ảnh check-in"
                                >
                                  <img
                                    src={vol.checkIn.capturedImageUrl}
                                    alt="Face"
                                    className="size-full object-cover"
                                  />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              {vol.checkIn.locationStatus === "VALID" ? (
                                <span className="text-emerald-600 font-medium">✓ GPS hợp lệ</span>
                              ) : (
                                <span className="text-rose-600 font-medium">✕ Ngoài vùng</span>
                              )}
                              {vol.checkIn.faceSimilarity && (
                                <span>• Khớp {(vol.checkIn.faceSimilarity * 100).toFixed(0)}%</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Chưa điểm danh
                          </Badge>
                        )}
                      </TableCell>

                      {/* Check-out */}
                      <TableCell>
                        {hasCheckOut && vol.checkOut ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Badge className="bg-amber-600 text-white text-[10px] gap-1 px-1.5 py-0">
                                <Check className="size-2.5" />
                                {formatDateTimeVN(vol.checkOut.attendedAt)}
                              </Badge>
                              {vol.checkOut.capturedImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedPhoto(vol.checkOut?.capturedImageUrl || null)}
                                  className="size-6 rounded border border-border overflow-hidden hover:ring-1 hover:ring-primary cursor-pointer"
                                  title="Xem ảnh check-out"
                                >
                                  <img
                                    src={vol.checkOut.capturedImageUrl}
                                    alt="Face"
                                    className="size-full object-cover"
                                  />
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              {vol.checkOut.locationStatus === "VALID" ? (
                                <span className="text-emerald-600 font-medium">✓ GPS hợp lệ</span>
                              ) : (
                                <span className="text-rose-600 font-medium">✕ Ngoài vùng</span>
                              )}
                              {vol.checkOut.faceSimilarity && (
                                <span>• Khớp {(vol.checkOut.faceSimilarity * 100).toFixed(0)}%</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">
                            Chưa điểm danh
                          </Badge>
                        )}
                      </TableCell>

                      {/* Đánh giá chung */}
                      <TableCell>
                        {hasCheckIn && hasCheckOut ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            Đủ 2 buổi (Hoàn thành)
                          </Badge>
                        ) : hasCheckIn ? (
                          <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                            Có mặt vào
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px]">
                            Vắng mặt
                          </Badge>
                        )}
                      </TableCell>

                      {/* Xác nhận thủ công */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!hasCheckIn && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleManualMark(vol.registrationId, "CHECK_IN")}
                              disabled={manualMarkingId === `${vol.registrationId}-CHECK_IN`}
                              className="h-7 text-[11px] text-emerald-700 border-emerald-200 hover:bg-emerald-50 cursor-pointer"
                            >
                              {manualMarkingId === `${vol.registrationId}-CHECK_IN` ? (
                                "..."
                              ) : (
                                "+ Vào"
                              )}
                            </Button>
                          )}

                          {!hasCheckOut && (
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleManualMark(vol.registrationId, "CHECK_OUT")}
                              disabled={manualMarkingId === `${vol.registrationId}-CHECK_OUT`}
                              className="h-7 text-[11px] text-amber-700 border-amber-200 hover:bg-amber-50 cursor-pointer"
                            >
                              {manualMarkingId === `${vol.registrationId}-CHECK_OUT` ? (
                                "..."
                              ) : (
                                "+ Ra"
                              )}
                            </Button>
                          )}

                          {hasCheckIn && hasCheckOut && (
                            <span className="text-[11px] text-muted-foreground">
                              ✓ Đã đủ
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal Phóng to Ảnh Check-in */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
          <DialogContent className="max-w-md p-4 text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                Ảnh Sinh Trắc Học Điểm Danh
              </DialogTitle>
            </DialogHeader>
            <div className="mt-3 overflow-hidden rounded-xl border border-border bg-black">
              <img
                src={selectedPhoto}
                alt="Captured Face verification"
                className="max-h-[70vh] w-full object-contain mx-auto"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
              >
                Đóng
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
