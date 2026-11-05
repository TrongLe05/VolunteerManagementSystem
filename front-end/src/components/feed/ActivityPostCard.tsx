import { useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import {
  Award,
  Calendar,
  CheckCircle2,
  Flag,
  Info,
  MapPin,
  Users,
  XCircle,
} from "lucide-react";

import type { Activity, RegistrationStatus } from "@/types/volunteer.types";
import { useAuth } from "@/context/AuthContext";
import { activityApi } from "@/api/activityApi";
import {
  formatDateTimeVN,
  getActivityStatusConfig,
  getRegistrationStatusBadge,
} from "@/lib/activity-helpers";
import { ActivityDetailDialog } from "./ActivityDetailDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import huyHieuDoan from "@/assets/HuyHieuDoan.png";
import authBanner from "@/assets/auth-banner.jpg";
import { Progress } from "@/components/ui/progress";

const DEFAULT_ACTIVITY_IMAGES = [
  authBanner,
  // "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1000&q=80",
  // "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=80",
  // "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1000&q=80",
];

function getActivityCoverImage(activity: Activity): string {
  if (activity.imageUrl) return activity.imageUrl;
  const hash = (activity.id || "")
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return DEFAULT_ACTIVITY_IMAGES[hash % DEFAULT_ACTIVITY_IMAGES.length];
}

interface ActivityPostCardProps {
  activity: Activity;
  registrationStatus?: RegistrationStatus | string | null;
  onRegistrationChanged?: () => void;
}

const calculateProgress = (
  registeredCount: number,
  capacity: number | null,
) => {
  if (!capacity || capacity === 0) {
    return 0;
  }
  return (registeredCount / capacity) * 100;
};

export function ActivityPostCard({
  activity,
  registrationStatus,
  onRegistrationChanged,
}: ActivityPostCardProps) {
  const { isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const isVolunteer = hasRole(["VOLUNTEER"]);
  const statusConfig = getActivityStatusConfig(activity.status);
  const regBadge = getRegistrationStatusBadge(registrationStatus);
  const primaryLocation = activity.locations?.[0];
  const coverImage = getActivityCoverImage(activity);

  const isStarted = new Date() >= new Date(activity.startTime);

  const canRegister =
    (activity.status === "OPEN" || activity.status === "PUBLISHED") &&
    !isStarted &&
    (!registrationStatus || registrationStatus === "CANCELLED");

  const canCancel =
    (registrationStatus === "REGISTERED" ||
      registrationStatus === "PENDING" ||
      registrationStatus === "APPROVED") &&
    !isStarted &&
    activity.status !== "ONGOING" &&
    activity.status !== "COMPLETED" &&
    activity.status !== "CANCELLED";

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

    setIsLoadingAction(true);
    try {
      await activityApi.register(activity.id);
      toast.success("Đăng ký hoạt động thành công! Vui lòng chờ xét duyệt.");
      onRegistrationChanged?.();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        const msg =
          data?.message ||
          data?.detail ||
          data?.title ||
          "Không thể đăng ký hoạt động này.";
        toast.error(msg);
      } else {
        toast.error("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleCancelRegistration = async () => {
    setIsLoadingAction(true);
    try {
      await toast.promise(activityApi.cancelRegistration(activity.id), {
        loading: "Đang hủy đăng ký...",
        success: "Đã hủy đăng ký tham gia hoạt động.",
        error: (err) => {
          if (axios.isAxiosError(err)) {
            const data = err.response?.data;
            return (
              data?.message ||
              data?.detail ||
              data?.title ||
              "Không thể hủy đăng ký lúc này."
            );
          }
          return "Lỗi kết nối máy chủ.";
        },
      });
      onRegistrationChanged?.();
    } catch {
      // Handled by toast.promise
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-slate-200/90 bg-white shadow-xs transition-shadow ">
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-blue-50 p-1.5 shadow-2xs">
              <img
                src={huyHieuDoan}
                alt={activity.organizationName}
                className="size-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm sm:text-base">
                  {activity.organizationName}
                </span>
                <CheckCircle2 className="size-4 text-blue-600 fill-blue-50" />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-blue-700">
                  <Flag className="size-3" />
                  {activity.campaignName}
                </span>
                <span>•</span>
                <span>Khởi hành: {formatDateTimeVN(activity.startTime)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
            {regBadge && (
              <Badge variant="outline" className={regBadge.className}>
                {regBadge.label}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pb-4">
          <div className="space-y-2">
            <Link to={`/activities/${activity.id}`}>
              <h3
                // onClick={() => setIsDetailOpen(true)}
                className="cursor-pointer text-base sm:text-lg font-bold leading-snug text-slate-900 hover:text-blue-600 transition-colors"
              >
                {activity.name}
              </h3>
            </Link>
            {activity.description && (
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {activity.description}
              </p>
            )}
          </div>

          {/* Hình ảnh hoạt động (Banner / Cover) */}
          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 group">
            <Link to={`/activities/${activity.id}`} className="block">
              <div className="aspect-[16/9] w-full overflow-hidden bg-slate-100">
                <img
                  src={coverImage}
                  alt={activity.name}
                  className="size-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Lớp gradient overlay và huy hiệu trên ảnh */}
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-transparent to-black/20 pointer-events-none" />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white pointer-events-none">
                <div className="flex items-center gap-1.5 text-xs text-white/95">
                  <MapPin className="size-3.5 text-rose-400 shrink-0" />
                  <span className="truncate max-w-[200px] sm:max-w-xs font-medium">
                    {primaryLocation
                      ? primaryLocation.name
                      : "Khuôn viên Trường ĐH Đồng Tháp"}
                  </span>
                </div>

                {(activity.creditDays > 0 || activity.creditHours > 0) && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-500/90 backdrop-blur-md px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                    <Award className="size-3.5" />+
                    {activity.creditDays > 0
                      ? `${activity.creditDays} ngày`
                      : ""}
                    {activity.creditDays > 0 &&
                      activity.creditHours > 0 &&
                      " • "}
                    {activity.creditHours > 0 ? `${activity.creditHours}h` : ""}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Khối thông tin thời gian & địa điểm điểm danh (nằm phía dưới ảnh) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-2xs">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 mt-0.5">
                  <Calendar className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500">
                    Thời gian diễn ra
                  </p>
                  <p className="font-semibold text-slate-800 truncate">
                    {formatDateTimeVN(activity.startTime)}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">
                    đến {formatDateTimeVN(activity.endTime)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-lg border border-slate-200/70 bg-white p-2.5 shadow-2xs">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-rose-50 text-rose-600 mt-0.5">
                  <MapPin className="size-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500">
                    Địa điểm tập kết (Geofence)
                  </p>
                  <p
                    className="font-semibold text-slate-800 truncate"
                    title={primaryLocation?.name}
                  >
                    {primaryLocation
                      ? primaryLocation.name
                      : "Khuôn viên Trường ĐH Đồng Tháp"}
                  </p>
                  <p className="text-[11px] text-blue-700 font-medium truncate">
                    {primaryLocation
                      ? `Bán kính: ${primaryLocation.allowedRadiusMeters}m`
                      : "Xem chi tiết vị trí"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chỉ tiêu & Tiến độ đăng ký */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <Users className="size-3.5 text-slate-500" />
                Chỉ tiêu tuyển chọn:
              </span>
              <span className="text-slate-900">
                <strong className="text-blue-700">
                  {activity.registeredCount}
                </strong>{" "}
                /{" "}
                {activity.capacity
                  ? `${activity.capacity} TNV`
                  : "Không giới hạn"}
              </span>
            </div>

            <Progress
              aria-label="Chỉ tiêu tình nguyện viên"
              value={calculateProgress(
                activity.registeredCount,
                activity.capacity,
              )}
              max={activity.capacity || 100}
              className="h-2 bg-slate-100"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t bg-slate-50/60 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDetailOpen(true)}
            className="flex-1 sm:flex-initial gap-1.5"
          >
            <Info className="size-4" />
            Chi tiết & Tọa độ GPS
          </Button>

          <div className="flex flex-1 sm:flex-initial items-center justify-end gap-2">
            {canCancel && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isLoadingAction}
                onClick={handleCancelRegistration}
                className="w-full sm:w-auto gap-1.5"
              >
                <XCircle className="size-4" />
                {isLoadingAction ? "Đang xử lý..." : "Hủy đăng ký"}
              </Button>
            )}

            {canRegister && (
              <Button
                type="button"
                size="sm"
                disabled={isLoadingAction}
                onClick={handleRegister}
                className="w-full sm:w-auto gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
              >
                <CheckCircle2 className="size-4" />
                {isLoadingAction
                  ? "Đang đăng ký..."
                  : isAuthenticated
                    ? "Đăng ký tham gia"
                    : "Đăng nhập để đăng ký"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      <ActivityDetailDialog
        activity={activity}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        canRegister={canRegister}
        isAuthenticated={isAuthenticated}
        isLoadingAction={isLoadingAction}
        onRegister={handleRegister}
      />
    </>
  );
}
