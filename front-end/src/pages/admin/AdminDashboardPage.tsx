import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CalendarHeart,
  Flag,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { activityApi } from "@/api/activityApi";
import { campaignApi } from "@/api/campaignApi";
import { organizationApi } from "@/api/organizationApi";
import { volunteerApi } from "@/api/volunteerApi";
import type { Organization } from "@/types/auth.types";
import type { Activity, Campaign } from "@/types/volunteer.types";
import { AdminActivitiesTab } from "@/components/admin/AdminActivitiesTab";
import { AdminCampaignsTab } from "@/components/admin/AdminCampaignsTab";
import { AdminOrganizationsTab } from "@/components/admin/AdminOrganizationsTab";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { AdminVolunteersTab } from "@/components/admin/AdminVolunteersTab";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type AdminTabKey =
  | "activities"
  | "campaigns"
  | "organizations"
  | "volunteers"
  | "users";

export function AdminDashboardPage() {
  const { user, hasRole } = useAuth();
  const isSuperAdmin = hasRole(["SUPER_ADMIN"]);

  const [activeTab, setActiveTab] = useState<AdminTabKey>("activities");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [volunteerCount, setVolunteerCount] = useState<number>(0);

  const fetchAdminData = useCallback(async () => {
    try {
      const [orgRes, campRes, actRes, volRes] = await Promise.allSettled([
        organizationApi.getAll(),
        campaignApi.getAll({ pageNumber: 1, pageSize: 100 }),
        activityApi.getManage({ pageNumber: 1, pageSize: 100 }),
        volunteerApi.getAll({ pageNumber: 1, pageSize: 1 }),
      ]);

      if (orgRes.status === "fulfilled") {
        setOrganizations(orgRes.value || []);
      }
      if (campRes.status === "fulfilled") {
        setCampaigns(campRes.value.items || []);
      }
      if (actRes.status === "fulfilled") {
        setActivities(actRes.value.items || []);
      }
      if (volRes.status === "fulfilled") {
        setVolunteerCount(volRes.value.totalCount || 0);
      }
    } catch {
      // Ignore error
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  useDashboardRealtime({
    onActivityChanged: fetchAdminData,
    onCampaignChanged: fetchAdminData,
    onOrganizationChanged: fetchAdminData,
    onVolunteerChanged: fetchAdminData,
  });

  const tabs: { key: AdminTabKey; label: string; icon: typeof CalendarHeart }[] =
    [
      {
        key: "activities",
        label: "Quản lý Hoạt động & Duyệt ĐK",
        icon: CalendarHeart,
      },
      {
        key: "campaigns",
        label: "Quản lý Chiến dịch",
        icon: Flag,
      },
      {
        key: "organizations",
        label: "Cơ cấu Tổ chức Đoàn - Hội",
        icon: Building2,
      },
      {
        key: "volunteers",
        label: "Tình nguyện viên & Import Excel",
        icon: Users,
      },
      {
        key: "users",
        label: "Quản lý Tài khoản",
        icon: UserCog,
      },
    ];

  return (
    <div className="min-h-screen bg-slate-100/80 py-8">
      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* Header Dashboard */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <LayoutDashboard className="size-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Bảng Điều Khiển Quản Trị Hệ Thống
              </h1>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 gap-1"
              >
                <ShieldCheck className="size-3.5" />
                {isSuperAdmin
                  ? "SUPER_ADMIN • Toàn trường"
                  : `ORGANIZATION_ADMIN • ${user?.organizationName || "Cấp Đơn vị"}`}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {isSuperAdmin
                ? "Quản trị toàn diện cây tổ chức Đoàn Trường ĐH Đồng Tháp, các chiến dịch, hoạt động GPS Geofence và hồ sơ tình nguyện viên."
                : `Quản lý các chiến dịch, hoạt động, xét duyệt đăng ký và danh sách đoàn viên thuộc phạm vi ${user?.organizationName || "đơn vị của bạn"}.`}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdminData}
            className="gap-1.5 self-start sm:self-auto shrink-0"
          >
            <RefreshCw className="size-4" />
            Đồng bộ dữ liệu
          </Button>
        </div>

        {/* 4 Thẻ Thống kê KPI */}
        <AdminStatsCards
          organizationCount={organizations.length}
          campaignCount={campaigns.length}
          activityCount={activities.length}
          volunteerCount={volunteerCount}
        />

        {/* Thanh chuyển Tab Quản trị */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  active
                    ? "border-blue-600 bg-blue-600 text-white shadow-xs"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Nội dung từng phân hệ quản trị */}
        {activeTab === "activities" && (
          <AdminActivitiesTab
            activities={activities}
            campaigns={campaigns}
            onRefresh={fetchAdminData}
          />
        )}

        {activeTab === "campaigns" && (
          <AdminCampaignsTab
            campaigns={campaigns}
            organizations={organizations}
            onRefresh={fetchAdminData}
          />
        )}

        {activeTab === "organizations" && (
          <AdminOrganizationsTab
            organizations={organizations}
            onRefresh={fetchAdminData}
          />
        )}

        {activeTab === "volunteers" && (
          <AdminVolunteersTab
            organizations={organizations}
            onCountChanged={setVolunteerCount}
          />
        )}

        {activeTab === "users" && (
          <AdminUsersTab organizations={organizations} />
        )}
      </div>
    </div>
  );
}
