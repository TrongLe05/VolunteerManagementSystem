import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { CalendarHeart, Loader2, RefreshCw, Search } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { activityApi } from "@/api/activityApi";
import { campaignApi } from "@/api/campaignApi";
import { organizationApi } from "@/api/organizationApi";
import type { Organization } from "@/types/auth.types";
import type {
  Activity,
  Campaign,
  MyActivityRegistration,
} from "@/types/volunteer.types";
import { ActivityPostCard } from "@/components/feed/ActivityPostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";

interface StatusOption {
  value: string;
  label: string;
}

const ACTIVITY_STATUS_OPTIONS: StatusOption[] = [
  { value: "OPEN", label: "Đang mở đăng ký" },
  { value: "ONGOING", label: "Đang diễn ra" },
  { value: "COMPLETED", label: "Đã hoàn thành" },
];

export function ActivitiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCampaignId = searchParams.get("campaignId") || "";

  const { user, isAuthenticated, hasRole } = useAuth();
  const isVolunteer = hasRole(["VOLUNTEER"]);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<
    MyActivityRegistration[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] =
    useState(initialCampaignId);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const selectedOrgObj = useMemo(
    () => organizations.find((o) => o.id === selectedOrgId) ?? null,
    [organizations, selectedOrgId],
  );

  const selectedCampaignObj = useMemo(
    () => campaigns.find((c) => c.id === selectedCampaignId) ?? null,
    [campaigns, selectedCampaignId],
  );

  const selectedStatusObj = useMemo(
    () =>
      ACTIVITY_STATUS_OPTIONS.find((s) => s.value === selectedStatus) ?? null,
    [selectedStatus],
  );

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await activityApi.getAll({
        searchTerm: searchTerm.trim() || undefined,
        organizationId: selectedOrgId || undefined,
        campaignId: selectedCampaignId || undefined,
        status: selectedStatus || undefined,
        pageNumber,
        pageSize: 8,
      });
      setActivities(res.items || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.totalCount || 0);
    } catch {
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    searchTerm,
    selectedOrgId,
    selectedCampaignId,
    selectedStatus,
    pageNumber,
    user,
  ]);

  const fetchMetaAndRegistrations = useCallback(async () => {
    try {
      const [campRes, orgRes] = await Promise.all([
        campaignApi.getAll({ pageNumber: 1, pageSize: 50 }),
        organizationApi.getAll(),
      ]);
      setCampaigns(campRes.items || []);
      setOrganizations(orgRes || []);

      if (isAuthenticated && isVolunteer) {
        const regRes = await activityApi.getMyRegistrations({
          pageNumber: 1,
          pageSize: 100,
        });
        setMyRegistrations(regRes.items || []);
      }
    } catch {
      // Ignore error
    }
  }, [isAuthenticated, isVolunteer, user]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    fetchMetaAndRegistrations();
  }, [fetchMetaAndRegistrations]);

  const registrationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of myRegistrations) {
      map.set(r.activityId, r.registrationStatus);
    }
    return map;
  }, [myRegistrations]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedOrgId("");
    setSelectedCampaignId("");
    setSelectedStatus("");
    setPageNumber(1);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-slate-100/80 py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header trang Hoạt động */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <CalendarHeart className="size-7 text-blue-600" />
              Khám phá Hoạt động Tình nguyện
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tra cứu, lọc theo cơ sở Đoàn, chiến dịch và đăng ký tham gia các
              hoạt động phù hợp với lịch học của bạn ({totalCount} hoạt động).
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchActivities}
            className="gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className="size-4" />
            Làm mới
          </Button>
        </div>

        {/* Bộ lọc đa tiêu chí bằng Combobox shadcn/ui */}
        <Card className="border-slate-200 bg-white">
          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPageNumber(1);
                }}
                placeholder="Tìm tên hoặc mô tả hoạt động..."
                className="pl-9 h-8"
              />
            </div>

            {/* Combobox 1: Đơn vị Đoàn - Hội */}
            <Combobox<Organization>
              items={organizations}
              value={selectedOrgObj}
              onValueChange={(org) => {
                setSelectedOrgId(org ? org.id : "");
                setPageNumber(1);
              }}
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

            {/* Combobox 2: Chiến dịch */}
            <Combobox<Campaign>
              items={campaigns}
              value={selectedCampaignObj}
              onValueChange={(camp) => {
                setSelectedCampaignId(camp ? camp.id : "");
                setPageNumber(1);
              }}
              itemToStringValue={(camp) => String(camp.id)}
              itemToStringLabel={(camp) => camp.name}
            >
              <ComboboxInput
                placeholder="Tất cả Chiến dịch"
                className="w-full"
                showClear={Boolean(selectedCampaignId)}
              />
              <ComboboxContent>
                <ComboboxEmpty>Không tìm thấy chiến dịch nào.</ComboboxEmpty>
                <ComboboxList>
                  {(camp: Campaign) => (
                    <ComboboxItem key={camp.id} value={camp}>
                      {camp.name}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>

            {/* Combobox 3: Trạng thái hoạt động */}
            <div className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <Combobox<StatusOption>
                  items={ACTIVITY_STATUS_OPTIONS}
                  value={selectedStatusObj}
                  onValueChange={(statusOpt) => {
                    setSelectedStatus(statusOpt ? statusOpt.value : "");
                    setPageNumber(1);
                  }}
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
              </div>

              {(searchTerm ||
                selectedOrgId ||
                selectedCampaignId ||
                selectedStatus) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-rose-600 shrink-0"
                >
                  Xóa lọc
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lưới danh sách Hoạt động (2 cột trên Desktop) */}
        {isLoading ? (
          <Card className="border-slate-200 bg-white py-16">
            <CardContent className="flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-blue-600" />
              <p className="text-sm text-muted-foreground">
                Đang tải danh sách hoạt động...
              </p>
            </CardContent>
          </Card>
        ) : activities.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-6">
              {activities.map((activity) => (
                <ActivityPostCard
                  key={activity.id}
                  activity={activity}
                  registrationStatus={registrationMap.get(activity.id)}
                  onRegistrationChanged={() => {
                    fetchActivities();
                    fetchMetaAndRegistrations();
                  }}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber <= 1}
                  onClick={() => setPageNumber((p) => p - 1)}
                >
                  Trang trước
                </Button>
                <span className="text-xs font-medium text-slate-700 px-3">
                  Trang {pageNumber} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pageNumber >= totalPages}
                  onClick={() => setPageNumber((p) => p + 1)}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="border-slate-200 bg-white py-14 text-center">
            <CardContent className="space-y-3">
              <p className="font-semibold text-slate-900">
                Không tìm thấy hoạt động tình nguyện nào
              </p>
              <p className="text-xs text-muted-foreground">
                Hãy thử thay đổi từ khóa hoặc xóa bộ lọc để xem toàn bộ hoạt
                động.
              </p>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Đặt lại bộ lọc
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
