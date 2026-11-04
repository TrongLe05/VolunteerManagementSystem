import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowRight,
  CalendarRange,
  Flag,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { campaignApi } from "@/api/campaignApi";
import { organizationApi } from "@/api/organizationApi";
import type { Organization } from "@/types/auth.types";
import type { Campaign } from "@/types/volunteer.types";
import { getActivityStatusConfig } from "@/lib/activity-helpers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import huyHieuDoan from "@/assets/HuyHieuDoan.png";

interface StatusOption {
  value: string;
  label: string;
}

const CAMPAIGN_STATUS_OPTIONS: StatusOption[] = [
  { value: "UPCOMING", label: "Sắp diễn ra" },
  { value: "ONGOING", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Đã kết thúc" },
];

export function CampaignsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const selectedOrgObj = useMemo(
    () => organizations.find((o) => o.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );

  const selectedStatusObj = useMemo(
    () =>
      CAMPAIGN_STATUS_OPTIONS.find((s) => s.value === selectedStatus) ?? null,
    [selectedStatus],
  );

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    try {
      const [campRes, orgRes] = await Promise.all([
        campaignApi.getAll({
          searchTerm: searchTerm.trim() || undefined,
          organizationId: selectedOrgId || undefined,
          status: selectedStatus || undefined,
          pageNumber: 1,
          pageSize: 30,
        }),
        organizationApi.getAll(),
      ]);

      setCampaigns(campRes.items || []);
      setOrganizations(orgRes || []);
    } catch {
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedOrgId, selectedStatus, user]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return (
    <div className="min-h-screen bg-slate-100/80 py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Flag className="size-7 text-blue-600" />
              Các Chiến dịch Tình nguyện
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tổng hợp các chiến dịch tình nguyện lớn của Trường Đại học Đồng
              Tháp và các Liên Chi đoàn trực thuộc.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCampaigns}
            className="gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </div>

        {/* Thanh tìm kiếm & lọc bằng Combobox shadcn/ui */}
        <Card className="border-slate-200 bg-white">
          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm tên chiến dịch..."
                className="pl-9 h-8"
              />
            </div>

            {/* Combobox 1: Đơn vị Đoàn - Hội */}
            <Combobox<Organization>
              items={organizations}
              value={selectedOrgObj}
              onValueChange={(org) => setSelectedOrgId(org ? org.id : "")}
              itemToStringValue={(org) => String(org.id)}
              itemToStringLabel={(org) => org.name}
            >
              <ComboboxInput
                placeholder="Tất cả Đơn vị Đoàn - Hội"
                className="w-full"
                showClear={Boolean(selectedOrgId)}
              />
              <ComboboxContent>
                <ComboboxEmpty>Không tìm thấy đơn vị nào.</ComboboxEmpty>
                <ComboboxList>
                  {(org: Organization) => (
                    <ComboboxItem key={org.id} value={org}>
                      {org.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            {/* Combobox 2: Trạng thái Chiến dịch */}
            <Combobox<StatusOption>
              items={CAMPAIGN_STATUS_OPTIONS}
              value={selectedStatusObj}
              onValueChange={(opt) => setSelectedStatus(opt ? opt.value : "")}
              itemToStringValue={(opt) => opt.value}
              itemToStringLabel={(opt) => opt.label}
            >
              <ComboboxInput
                placeholder="Mọi trạng thái"
                className="w-full"
                showClear={Boolean(selectedStatus)}
              />
              <ComboboxContent>
                <ComboboxEmpty>Không có trạng thái phù hợp.</ComboboxEmpty>
                <ComboboxList>
                  {(opt: StatusOption) => (
                    <ComboboxItem key={opt.value} value={opt}>
                      {opt.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </CardContent>
        </Card>

        {/* Danh sách Chiến dịch */}
        {isLoading ? (
          <Card className="border-slate-200 bg-white py-16">
            <CardContent className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">
                Đang tải danh sách chiến dịch...
              </p>
            </CardContent>
          </Card>
        ) : campaigns.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((camp) => {
              const statusCfg = getActivityStatusConfig(camp.status);
              return (
                <Card
                  key={camp.id}
                  className="flex flex-col justify-between overflow-hidden border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <div className="h-2 bg-linear-to-r from-blue-600 via-sky-500 to-emerald-500" />
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={huyHieuDoan}
                            alt="Đoàn"
                            className="size-6 shrink-0 object-contain"
                          />
                          <span className="truncate text-xs font-semibold text-blue-700">
                            {camp.organizationName}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={statusCfg.className}
                        >
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-bold leading-snug text-slate-900">
                        {camp.name}
                      </CardTitle>
                      {camp.description && (
                        <CardDescription className="line-clamp-3 text-xs leading-relaxed">
                          {camp.description}
                        </CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="pb-4">
                      <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700 border">
                        <CalendarRange className="size-4 text-blue-600 shrink-0" />
                        <span>
                          Thời gian: <strong>{camp.startDate}</strong> đến{" "}
                          <strong>{camp.endDate}</strong>
                        </span>
                      </div>
                    </CardContent>
                  </div>

                  <CardFooter className="border-t bg-slate-50/50 px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(`/activities?campaignId=${camp.id}`)
                      }
                      className="w-full justify-between text-blue-700 hover:bg-blue-50"
                    >
                      <span>Xem các hoạt động trực thuộc</span>
                      <ArrowRight className="size-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-slate-200 bg-white py-14 text-center">
            <CardContent className="space-y-2">
              <p className="font-semibold text-slate-900">
                Chưa có chiến dịch nào khớp với bộ lọc
              </p>
              <p className="text-xs text-muted-foreground">
                Hãy thử chọn đơn vị khác hoặc xóa từ khóa tìm kiếm.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
