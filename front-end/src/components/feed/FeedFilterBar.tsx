import { Flag, Flame, RefreshCw, Search } from "lucide-react";
import type { Campaign } from "@/types/volunteer.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface FeedFilterBarProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedStatus: string | null;
  onStatusChange: (status: string | null) => void;
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onSelectCampaign: (campaignId: string | null) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onRefresh: () => void;
}

const STATUS_TABS = [
  { value: null, label: "Tất cả bài viết" },
  { value: "OPEN", label: "Đang mở đăng ký" },
  { value: "ONGOING", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
];

export function FeedFilterBar({
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  campaigns,
  selectedCampaignId,
  onSelectCampaign,
  hasActiveFilters,
  onResetFilters,
  onRefresh,
}: FeedFilterBarProps) {
  return (
    <div className="space-y-3">
      <Card className="border-slate-200 bg-white">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm hoạt động tình nguyện, địa điểm, nội dung..."
                className="pl-9 h-9"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              title="Làm mới bảng tin"
            >
              <RefreshCw className="size-4" />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => onStatusChange(tab.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  selectedStatus === tab.value
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="ml-auto text-xs font-medium text-rose-600 hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {campaigns.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectCampaign(null)}
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
              selectedCampaignId === null
                ? "border-blue-600 bg-blue-50 text-blue-700 shadow-2xs"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Flame className="size-3.5 text-orange-500" />
            Mọi chiến dịch
          </button>
          {campaigns.map((camp) => (
            <button
              key={camp.id}
              type="button"
              onClick={() =>
                onSelectCampaign(
                  selectedCampaignId === camp.id ? null : camp.id,
                )
              }
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                selectedCampaignId === camp.id
                  ? "border-blue-600 bg-blue-50 text-blue-700 shadow-2xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Flag className="size-3.5 text-blue-600" />
              <span className="max-w-44 truncate">{camp.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
