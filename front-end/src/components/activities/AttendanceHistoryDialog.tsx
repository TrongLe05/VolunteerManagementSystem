import { useState } from "react";
import { Link } from "react-router";
import {
  Camera,
  CheckCircle2,
  Compass,
  Download,
  ExternalLink,
  Maximize2,
  ScanFace,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

import type { MyActivityRegistration, MyAttendanceRecord } from "@/types/volunteer.types";
import { formatDateTimeVN } from "@/lib/activity-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface AttendanceHistoryDialogProps {
  registration: MyActivityRegistration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckInClick?: (activityId: string) => void;
}

export function AttendanceHistoryDialog({
  registration,
  open,
  onOpenChange,
  onCheckInClick,
}: AttendanceHistoryDialogProps) {
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  if (!registration) return null;

  const attendances: MyAttendanceRecord[] = registration.attendances || [];
  const hasAttendances = attendances.length > 0;

  const checkInRecord = attendances.find(
    (a) => a.sessionType === "CHECK_IN" || a.sessionType?.toUpperCase().includes("IN"),
  );
  const checkOutRecord = attendances.find(
    (a) => a.sessionType === "CHECK_OUT" || a.sessionType?.toUpperCase().includes("OUT"),
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 sm:max-w-3xl">
          {/* Header với phong cách thẻ số */}
          <div className="border-b border-slate-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 gap-1 text-[11px] font-semibold">
                <ScanFace className="size-3.5" />
                Hệ thống Điểm danh GPS & Khuôn mặt AI
              </Badge>
              <span className="text-xs text-slate-300 font-mono">
                Mã ĐK: #{registration.registrationId.slice(0, 8)}
              </span>
            </div>

            <DialogTitle className="text-lg sm:text-xl font-bold leading-snug text-white">
              {registration.activityName}
            </DialogTitle>
            <DialogDescription className="mt-1 text-xs text-blue-100/80">
              {registration.organizationName} • {registration.campaignName}
            </DialogDescription>

            {/* Tóm tắt nhanh lượt điểm danh */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs">
              <div className="rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
                <p className="text-[11px] text-blue-200">Lượt Check-in vào</p>
                <p className="mt-0.5 font-bold text-white flex items-center gap-1.5">
                  {checkInRecord ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      {new Date(checkInRecord.attendedAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal">Chưa điểm danh</span>
                  )}
                </p>
              </div>

              <div className="rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
                <p className="text-[11px] text-blue-200">Lượt Check-out ra</p>
                <p className="mt-0.5 font-bold text-white flex items-center gap-1.5">
                  {checkOutRecord ? (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-400" />
                      {new Date(checkOutRecord.attendedAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </>
                  ) : (
                    <span className="text-slate-400 font-normal">Chưa điểm danh</span>
                  )}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 rounded-lg bg-white/10 p-2.5 backdrop-blur-xs border border-white/10">
                <p className="text-[11px] text-blue-200">Tích lũy ghi nhận</p>
                <p className="mt-0.5 font-bold text-amber-300">
                  +{registration.creditDay} ngày ({registration.creditHour}h)
                </p>
              </div>
            </div>
          </div>

          {/* Thân danh sách lượt điểm danh */}
          <div className="p-5 sm:p-6 space-y-6">
            {hasAttendances ? (
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="size-4 text-blue-600" />
                  Ảnh selfie hiện trường & Thông số định vị ({attendances.length} lượt)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attendances.map((record, index) => {
                    const isCheckIn =
                      record.sessionType === "CHECK_IN" ||
                      record.sessionType?.toUpperCase().includes("IN");

                    return (
                      <div
                        key={record.id || index}
                        className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between"
                      >
                        {/* Tiêu đề phiên */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isCheckIn
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            <UserCheck className="size-3.5" />
                            {isCheckIn ? "LƯỢT VÀO (CHECK-IN)" : "LƯỢT RA (CHECK-OUT)"}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {formatDateTimeVN(record.attendedAt)}
                          </span>
                        </div>

                        {/* Vùng ảnh minh chứng selfie */}
                        <div className="p-4 space-y-3">
                          <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-200 shadow-2xs group">
                            {record.capturedImageUrl ? (
                              <>
                                <img
                                  src={record.capturedImageUrl}
                                  alt={`Selfie điểm danh ${record.sessionType}`}
                                  className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

                                {/* Nút phóng to ảnh */}
                                <button
                                  type="button"
                                  onClick={() => setZoomImage(record.capturedImageUrl || null)}
                                  className="absolute top-2.5 right-2.5 flex size-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-xs hover:bg-black/80 transition-colors cursor-pointer"
                                  title="Phóng to ảnh minh chứng"
                                >
                                  <Maximize2 className="size-4" />
                                </button>

                                {/* Watermark thông tin thời gian & GPS trên ảnh */}
                                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white text-[10px] space-y-0.5">
                                  <p className="font-semibold truncate">
                                    📍 Tọa độ:{" "}
                                    {record.locationStatus === "VALID"
                                      ? "Trong khuôn viên ĐH Đồng Tháp"
                                      : "Khu vực hoạt động"}
                                  </p>
                                  <p className="text-white/80 font-mono">
                                    ⏱ {new Date(record.attendedAt).toLocaleTimeString("vi-VN", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                    })}{" "}
                                    - {new Date(record.attendedAt).toLocaleDateString("vi-VN")}
                                  </p>
                                </div>
                              </>
                            ) : (
                              <div className="flex size-full flex-col items-center justify-center gap-2 text-slate-400 p-4 text-center">
                                <ScanFace className="size-10 text-slate-500" />
                                <p className="text-xs font-medium text-slate-300">
                                  Điểm danh xác nhận thủ công
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  (Cán bộ phụ trách xác nhận trực tiếp tại hiện trường)
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Chi tiết dữ liệu AI & GPS */}
                          <div className="space-y-2 rounded-xl bg-slate-50/90 p-3 text-xs border border-slate-100">
                            {/* Kết quả AI Face Matching */}
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-indigo-600" />
                                Khuôn mặt AI:
                              </span>
                              <span className="font-semibold text-indigo-900 inline-flex items-center gap-1">
                                <ShieldCheck className="size-3.5 text-indigo-600" />
                                {record.faceSimilarity != null
                                  ? `${Math.round(Number(record.faceSimilarity) * 100)}% khớp FaceID`
                                  : "Chính xác"}
                              </span>
                            </div>

                            {/* Liveness Check */}
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <ScanFace className="size-3.5 text-blue-600" />
                                Xác thực Liveness:
                              </span>
                              <Badge
                                variant="secondary"
                                className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold"
                              >
                                {record.isLivenessVerified ? "Người thật" : "Hợp lệ"}
                              </Badge>
                            </div>

                            {/* GPS Geofence */}
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground flex items-center gap-1.5">
                                <Compass className="size-3.5 text-amber-600" />
                                Vị trí GPS Geofence:
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-[10px] font-semibold ${
                                  record.locationStatus === "VALID"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {record.locationStatus === "VALID"
                                  ? "Hợp lệ (Trong vùng)"
                                  : "Đang chờ duyệt"}
                              </Badge>
                            </div>

                            {/* Độ chính xác GPS */}
                            {record.locationAccuracyMeters && (
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>Sai số định vị:</span>
                                <span className="font-mono">
                                  ±{Math.round(Number(record.locationAccuracyMeters))} mét
                                </span>
                              </div>
                            )}

                            {record.note && (
                              <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-600 italic">
                                Ghi chú: {record.note}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Footer thẻ */}
                        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-right">
                          <span className="text-[11px] font-semibold text-emerald-700 flex items-center justify-end gap-1">
                            <CheckCircle2 className="size-3.5" />
                            Đã ghi nhận điểm danh
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-3">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Camera className="size-7" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">
                  Chưa có lịch sử điểm danh nào
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Khi đến điểm tập trung của hoạt động, bạn hãy bấm nút{" "}
                  <strong className="text-blue-700">"Điểm danh ngay"</strong> khi ban tổ
                  chức mở phiên để xác thực tọa độ GPS Geofence và quét khuôn mặt AI. Ảnh
                  selfie minh chứng sẽ tự động lưu trữ tại đây.
                </p>

                {registration.activityStatus === "ONGOING" && onCheckInClick && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onOpenChange(false);
                      onCheckInClick(registration.activityId);
                    }}
                    className="mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700"
                  >
                    <ScanFace className="size-4 mr-1.5" />
                    Mở màn hình Điểm danh ngay
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer Modal */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-200 bg-slate-50 px-6 py-3.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Đóng
            </Button>

            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to={`/activities/${registration.activityId}`}>
                  <ExternalLink className="size-3.5" />
                  Xem trang hoạt động
                </Link>
              </Button>

              {registration.activityStatus === "ONGOING" && onCheckInClick && (
                <Button
                  size="sm"
                  onClick={() => {
                    onOpenChange(false);
                    onCheckInClick(registration.activityId);
                  }}
                  className="bg-blue-600 text-white hover:bg-blue-700 gap-1.5 font-medium"
                >
                  <ScanFace className="size-4" />
                  Điểm danh ngay
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox phóng to ảnh chụp */}
      {zoomImage && (
        <Dialog open={Boolean(zoomImage)} onOpenChange={() => setZoomImage(null)}>
          <DialogContent className="max-w-2xl bg-black/95 p-2 border-slate-800 text-white">
            <div className="relative aspect-auto max-h-[80vh] flex items-center justify-center overflow-hidden rounded-lg">
              <img
                src={zoomImage}
                alt="Minh chứng điểm danh phóng to"
                className="max-h-[75vh] w-auto rounded-lg object-contain shadow-2xl"
              />
            </div>
            <div className="flex items-center justify-between px-2 pt-2 text-xs text-slate-300">
              <span className="font-medium">Ảnh chụp xác thực khuôn mặt hiện trường</span>
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20 h-8 gap-1.5"
                onClick={() => window.open(zoomImage, "_blank")}
              >
                <Download className="size-3.5" />
                Mở ảnh gốc
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
