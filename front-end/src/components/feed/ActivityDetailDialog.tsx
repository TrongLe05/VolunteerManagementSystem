import { Building2, ExternalLink, MapPin } from "lucide-react";
import type { Activity } from "@/types/volunteer.types";
import {
  formatDateTimeVN,
  getActivityStatusConfig,
} from "@/lib/activity-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ActivityDetailDialogProps {
  activity: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canRegister: boolean;
  isAuthenticated: boolean;
  isLoadingAction: boolean;
  onRegister: () => Promise<void>;
}

export function ActivityDetailDialog({
  activity,
  open,
  onOpenChange,
  canRegister,
  isAuthenticated,
  isLoadingAction,
  onRegister,
}: ActivityDetailDialogProps) {
  const statusConfig = getActivityStatusConfig(activity.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusConfig.className}>
              {statusConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {activity.campaignName}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold leading-snug pt-1">
            {activity.name}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
            <Building2 className="size-3.5" />
            Đơn vị tổ chức: {activity.organizationName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          {activity.description && (
            <div className="rounded-lg bg-slate-50 p-3 text-slate-700 leading-relaxed whitespace-pre-line border">
              {activity.description}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Bắt đầu</p>
              <p className="font-semibold text-slate-900">
                {formatDateTimeVN(activity.startTime)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Kết thúc</p>
              <p className="font-semibold text-slate-900">
                {formatDateTimeVN(activity.endTime)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Quyền lợi Tình nguyện viên
              </p>
              <p className="font-semibold text-emerald-700">
                +{activity.creditDays} ngày CTXH
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                Số lượng tuyển tối đa
              </p>
              <p className="font-semibold text-slate-900">
                {activity.capacity
                  ? `${activity.capacity} Tình nguyện viên`
                  : "Không giới hạn"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-slate-900 flex items-center gap-1.5">
              <MapPin className="size-4 text-rose-600" />
              Vùng điểm danh GPS Geofencing ({activity.locations?.length || 0})
            </h4>
            {activity.locations && activity.locations.length > 0 ? (
              <div className="space-y-2">
                {activity.locations.map((loc) => (
                  <div
                    key={loc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50/50 p-3"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-slate-900">{loc.name}</p>
                      {loc.address && (
                        <p className="text-xs text-muted-foreground">
                          {loc.address}
                        </p>
                      )}
                      <p className="text-[11px] font-mono text-slate-600">
                        Tọa độ: {loc.latitude.toFixed(6)},{" "}
                        {loc.longitude.toFixed(6)} • Bán kính:{" "}
                        <strong>{loc.allowedRadiusMeters}m</strong>
                      </p>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline shrink-0"
                    >
                      Mở bản đồ
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Chưa cập nhật điểm tọa độ GPS cho hoạt động này.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          {canRegister && (
            <Button
              type="button"
              disabled={isLoadingAction}
              onClick={async () => {
                await onRegister();
                onOpenChange(false);
              }}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isAuthenticated
                ? "Đăng ký tham gia ngay"
                : "Đăng nhập để đăng ký"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
