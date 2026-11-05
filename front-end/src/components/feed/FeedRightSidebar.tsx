import { Link } from "react-router";
import { Flag, ShieldCheck } from "lucide-react";
import type { Campaign } from "@/types/volunteer.types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeedRightSidebarSkeleton } from "@/components/common/Skeletons";

interface FeedRightSidebarProps {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string | null) => void;
  isLoading?: boolean;
}

export function FeedRightSidebar({
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  isLoading = false,
}: FeedRightSidebarProps) {
  return (
    <aside className="hidden lg:block lg:col-span-3">
      <div className="sticky top-22 space-y-4">
        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-1.5 text-sm font-bold">
                <Flag className="size-4 text-blue-600" />
                Chiến dịch Tình nguyện
              </CardTitle>
              {selectedCampaignId ? (
                <button
                  type="button"
                  onClick={() => onSelectCampaign(null)}
                  className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                >
                  Bỏ lọc
                </button>
              ) : (
                <Link
                  to="/activities"
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Xem tất cả
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {isLoading ? (
              <FeedRightSidebarSkeleton />
            ) : campaigns.length > 0 ? (
              campaigns.slice(0, 4).map((camp) => (
                <div
                  key={camp.id}
                  onClick={() =>
                    onSelectCampaign(
                      selectedCampaignId === camp.id ? null : camp.id,
                    )
                  }
                  className={`cursor-pointer rounded-xl border p-3 transition-all ${
                    selectedCampaignId === camp.id
                      ? "border-blue-600 bg-blue-50/70"
                      : "border-slate-200/80 hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-xs text-slate-900 line-clamp-2">
                      {camp.name}
                    </p>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {camp.status === "ONGOING"
                        ? "Đang diễn ra"
                        : "Mở đăng ký"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground truncate">
                    {camp.organizationName}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-blue-700">
                    {camp.startDate} → {camp.endDate}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground py-2">
                Chưa có chiến dịch nào đang mở.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-bold">
              <ShieldCheck className="size-4 text-emerald-600" />
              Quy trình Tham gia & Điểm danh
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Đăng ký trên Bảng tin
                </p>
                <p className="text-muted-foreground">
                  Chọn hoạt động phù hợp và bấm Đăng ký tham gia.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Có mặt tại Vùng GPS Geofence
                </p>
                <p className="text-muted-foreground">
                  Đến đúng địa điểm tập kết trong bán kính cho phép.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-slate-900">
                  Quét Khuôn mặt AI & Cộng điểm
                </p>
                <p className="text-muted-foreground">
                  Xác thực khuôn mặt trực tiếp để ghi nhận ngày tình nguyện.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
