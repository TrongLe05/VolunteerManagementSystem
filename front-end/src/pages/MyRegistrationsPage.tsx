import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import axios from "axios";
import {
  Award,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Flag,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { activityApi } from "@/api/activityApi";
import type { MyActivityRegistration } from "@/types/volunteer.types";
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

export function MyRegistrationsPage() {
  const [registrations, setRegistrations] = useState<MyActivityRegistration[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);

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

    return {
      total: registrations.length,
      approvedCount: approved.length,
      pendingCount: pending.length,
      totalDays,
      totalHours,
    };
  }, [registrations]);

  const handleCancel = async (activityId: string) => {
    setCancellingId(activityId);
    try {
      await activityApi.cancelRegistration(activityId);
      toast.success("Đã hủy đăng ký hoạt động thành công.");
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
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-8">
      <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <ClipboardCheck className="size-7 text-blue-600" />
              Hoạt động Tình nguyện của tôi
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Theo dõi trạng thái xét duyệt đăng ký và tổng số ngày/giờ tình
              nguyện tích lũy của bạn.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMyRegistrations}
            className="gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </div>

        {/* Thẻ Thống kê nhanh */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Đã đăng ký</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.total}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Đã được duyệt</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {stats.approvedCount}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Đang chờ duyệt</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {stats.pendingCount}
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">
                Tổng tích lũy dự kiến
              </p>
              <p className="mt-1 text-xl font-bold text-blue-600">
                {stats.totalDays} ngày ({stats.totalHours}h)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Thanh lọc trạng thái đăng ký */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { value: "", label: "Tất cả" },
            { value: "REGISTERED", label: "Chờ duyệt" },
            { value: "APPROVED", label: "Đã duyệt" },
            { value: "REJECTED", label: "Từ chối" },
            { value: "CANCELLED", label: "Đã hủy" },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Danh sách các hoạt động đã đăng ký */}
        {isLoading ? (
          <Card className="border-slate-200 bg-white py-16">
            <CardContent className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">
                Đang tải danh sách đăng ký của bạn...
              </p>
            </CardContent>
          </Card>
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

              return (
                <Card
                  key={item.registrationId}
                  className="border-slate-200 bg-white"
                >
                  <CardHeader className="flex flex-col justify-between gap-2 pb-3 sm:flex-row sm:items-start">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-blue-700">
                          {item.organizationName}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <Flag className="size-3" />
                          {item.campaignName}
                        </span>
                      </div>
                      <CardTitle className="text-base font-bold text-slate-900">
                        {item.activityName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Đăng ký lúc: {formatDateTimeVN(item.registeredAt)}
                      </CardDescription>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
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

                  <CardContent className="flex flex-col justify-between gap-4 border-t bg-slate-50/50 pt-3 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-blue-600" />
                        {formatDateTimeVN(item.startTime)} →{" "}
                        {formatDateTimeVN(item.endTime)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                        <Award className="size-3.5" />+{item.creditDay} ngày (
                        <Clock className="size-3" /> {item.creditHour} giờ)
                      </span>
                    </div>

                    {canCancel ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={cancellingId === item.activityId}
                        onClick={() => handleCancel(item.activityId)}
                        className="gap-1.5 self-end sm:self-auto"
                      >
                        <XCircle className="size-4" />
                        {cancellingId === item.activityId
                          ? "Đang hủy..."
                          : "Hủy đăng ký"}
                      </Button>
                    ) : isStarted &&
                      (item.registrationStatus === "REGISTERED" ||
                        item.registrationStatus === "APPROVED") ? (
                      <span className="text-xs text-muted-foreground italic self-end sm:self-auto">
                        Hoạt động đã diễn ra (không thể hủy)
                      </span>
                    ) : null}
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
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link to="/activities">Khám phá Hoạt động ngay</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
