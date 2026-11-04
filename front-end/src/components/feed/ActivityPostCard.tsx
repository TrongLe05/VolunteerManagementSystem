import { useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Flag,
  Info,
  MapPin,
  Sparkles,
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
import { Progress } from "@/components/ui/progress";

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
      <Card className="overflow-hidden border-slate-200/90 bg-white shadow-xs transition-shadow hover:shadow-md">
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

          <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 p-4 sm:p-5 text-white shadow-inner">
            <div className="relative z-10 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-xs">
                  <Sparkles className="size-3.5 text-amber-300" />
                  Điểm danh thông minh GPS & AI FaceID
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 border border-amber-300/40 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
                  <Award className="size-3.5" />+{activity.creditDays} ngày (
                  {activity.creditHours} giờ)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs sm:text-sm">
                <div className="flex items-start gap-2 rounded-lg bg-black/20 p-2.5 backdrop-blur-xs">
                  <Calendar className="size-4 shrink-0 text-blue-200 mt-0.5" />
                  <div>
                    <p className="text-[11px] text-blue-200">
                      Thời gian diễn ra
                    </p>
                    <p className="font-semibold">
                      {formatDateTimeVN(activity.startTime)}
                    </p>
                    <p className="text-[11px] text-white/80">
                      đến {formatDateTimeVN(activity.endTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-black/20 p-2.5 backdrop-blur-xs">
                  <MapPin className="size-4 shrink-0 text-rose-300 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] text-blue-200">
                      Địa điểm tập kết (Geofence)
                    </p>
                    <p className="font-semibold truncate">
                      {primaryLocation
                        ? primaryLocation.name
                        : "Khuôn viên Trường ĐH Đồng Tháp"}
                    </p>
                    <p className="text-[11px] text-white/80 truncate">
                      {primaryLocation
                        ? `Bán kính điểm danh: ${primaryLocation.allowedRadiusMeters}m`
                        : "Xem chi tiết vị trí trên bản đồ"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-muted-foreground">
            <div className="flex flex-col items-start gap-4">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 " />
                {formatDateTimeVN(activity.startTime)}
              </span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                <Users className="size-4 " />
                Chỉ tiêu:{" "}
                <strong>
                  {activity.capacity
                    ? `${activity.capacity} TNV`
                    : "Không giới hạn"}
                </strong>
              </span>
            </div>
            <div className="flex flex-col items-start gap-4">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 " />
                {primaryLocation.address}
              </span>
              <span className="inline-flex items-center gap-1 font-medium ">
                <Clock className="size-3.5" />
                Tích lũy {activity.creditHours} giờ tình nguyện
              </span>
            </div>

            <Progress
              aria-label="Chỉ tiêu tình nguyện viên"
              value={calculateProgress(
                activity.registeredCount,
                activity.capacity,
              )}
              max={activity.capacity || 100}
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
