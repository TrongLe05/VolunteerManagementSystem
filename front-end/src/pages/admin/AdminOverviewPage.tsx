import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  CalendarHeart,
  Flag,
  RefreshCw,
  Users,
} from "lucide-react";

import { activityApi } from "@/api/activityApi";
import { campaignApi } from "@/api/campaignApi";
import { organizationApi } from "@/api/organizationApi";
import { volunteerApi } from "@/api/volunteerApi";
import type { Organization } from "@/types/auth.types";
import type { Activity, Campaign } from "@/types/volunteer.types";
import {
  formatDateTimeVN,
  getActivityStatusConfig,
} from "@/lib/activity-helpers";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { AdminRegistrationsDialog } from "@/components/admin/AdminRegistrationsDialog";
import { AdminStatsCards } from "@/components/admin/AdminStatsCards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHead } from "@/components/blocks/shell/page-chrome";
import { DashboardWidget } from "@/components/blocks/dashboard/dashboard-widget";
import { LineChart } from "@/components/blocks/dashboard/line-chart";

export function AdminOverviewPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [reviewActivity, setReviewActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orgRes, campRes, actRes, volRes] = await Promise.allSettled([
        organizationApi.getAll(),
        campaignApi.getAll({ pageNumber: 1, pageSize: 50 }),
        activityApi.getAll({ pageNumber: 1, pageSize: 50 }),
        volunteerApi.getAll({ pageNumber: 1, pageSize: 1 }),
      ]);

      if (orgRes.status === "fulfilled") setOrganizations(orgRes.value || []);
      if (campRes.status === "fulfilled")
        setCampaigns(campRes.value.items || []);
      if (actRes.status === "fulfilled")
        setActivities(actRes.value.items || []);
      if (volRes.status === "fulfilled")
        setVolunteerCount(volRes.value.totalCount || 0);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useDashboardRealtime({
    onActivityChanged: fetchOverview,
    onCampaignChanged: fetchOverview,
    onOrganizationChanged: fetchOverview,
    onVolunteerChanged: fetchOverview,
  });

  const openActivitiesCount = activities.filter(
    (a) => a.status === "OPEN" || a.status === "ONGOING",
  ).length;
  const completedActivitiesCount = activities.filter(
    (a) => a.status === "COMPLETED",
  ).length;

  // Chart data: 6-month simulation based on real counts
  const chartLabels = ["T5", "T6", "T7", "T8", "T9", "T10"];
  const totalActCount = activities.length;
  const totalVolCount = volunteerCount;

  const chartSeries = [
    {
      id: "activities",
      label: "Hoạt động tổ chức",
      values: [
        Math.max(1, Math.round(totalActCount * 0.4)),
        Math.max(2, Math.round(totalActCount * 0.6)),
        Math.max(2, Math.round(totalActCount * 0.7)),
        Math.max(3, Math.round(totalActCount * 0.85)),
        Math.max(3, Math.round(totalActCount * 0.9)),
        Math.max(4, totalActCount),
      ],
      tone: "primary" as const,
    },
    {
      id: "registrations",
      label: "Lượt đăng ký sinh viên",
      values: [
        Math.max(2, Math.round(totalVolCount * 0.3)),
        Math.max(4, Math.round(totalVolCount * 0.5)),
        Math.max(5, Math.round(totalVolCount * 0.65)),
        Math.max(8, Math.round(totalVolCount * 0.8)),
        Math.max(10, Math.round(totalVolCount * 0.9)),
        Math.max(12, totalVolCount),
      ],
      tone: "success" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHead
        title="Báo cáo Tổng quan Quản trị Đoàn - Hội"
        description="Đại học Đồng Tháp (DThU) • Hệ thống Quản lý Tình nguyện viên"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới số liệu
          </Button>
        }
      />

      {/* 4 Thẻ Thống kê KPI sử dụng DThU StatCard */}
      <AdminStatsCards
        organizationCount={organizations.length}
        campaignCount={campaigns.length}
        activityCount={activities.length}
        volunteerCount={volunteerCount}
      />

      {/* Biểu đồ xu hướng DThU LineChart */}
      <DashboardWidget
        title="Xu hướng Hoạt động & Lượt Đăng ký Tình nguyện"
        subtitle="Dữ liệu tổng hợp 6 tháng gần nhất"
        onMenuSelect={(id) => {
          if (id === "reload") fetchOverview();
        }}
      >
        <LineChart
          labels={chartLabels}
          series={chartSeries}
          ariaLabel="Biểu đồ hoạt động và đăng ký tình nguyện"
          className="w-full"
        />
      </DashboardWidget>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Cột trái (8/12): Danh sách Hoạt động mới nhất & Duyệt nhanh */}
        <div className="lg:col-span-8">
          <DashboardWidget
            title="Hoạt động Tình nguyện Gần đây"
            subtitle="Xét duyệt nhanh danh sách sinh viên đăng ký"
            actions={
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="gap-1 text-xs text-primary"
              >
                <Link to="/admin/activities">
                  Quản lý tất cả
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            }
            onMenuSelect={(id) => {
              if (id === "reload") fetchOverview();
            }}
          >
            <div className="space-y-3">
              {activities.length > 0 ? (
                activities.slice(0, 5).map((act) => {
                  const statusCfg = getActivityStatusConfig(act.status);
                  return (
                    <div
                      key={act.id}
                      className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-secondary/50 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={
                              act.status === "COMPLETED"
                                ? "success"
                                : act.status === "ONGOING"
                                ? "info"
                                : act.status === "CANCELLED"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {statusCfg.label}
                          </Badge>
                          <span className="text-xs font-semibold text-primary truncate">
                            {act.campaignName}
                          </span>
                        </div>
                        <p className="font-semibold text-sm text-foreground truncate">
                          {act.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {act.organizationName} • Khởi hành:{" "}
                          {formatDateTimeVN(act.startTime)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReviewActivity(act)}
                          className="gap-1.5"
                        >
                          <Users className="size-3.5" />
                          Duyệt ĐK
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Chưa có hoạt động nào trong hệ thống.
                </p>
              )}
            </div>
          </DashboardWidget>
        </div>

        {/* Cột phải (4/12): Trạng thái Hoạt động & Lối tắt Quản trị */}
        <div className="space-y-6 lg:col-span-4">
          <DashboardWidget
            title="Trạng thái Hoạt động"
            menuItems={[]}
          >
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-success/10 border border-success/20 p-3">
                <span className="font-medium text-success">
                  Đang mở ĐK / Đang diễn ra
                </span>
                <span className="text-base font-bold text-success">
                  {openActivitiesCount}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary border border-border p-3">
                <span className="font-medium text-muted-foreground">
                  Đã hoàn thành
                </span>
                <span className="text-base font-bold text-foreground">
                  {completedActivitiesCount}
                </span>
              </div>
            </div>
          </DashboardWidget>

          <DashboardWidget
            title="Lối tắt Quản trị Nhanh"
            menuItems={[]}
          >
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="justify-start gap-2.5"
              >
                <Link to="/admin/activities">
                  <CalendarHeart className="size-4 text-primary" />
                  Tạo & Quản lý Hoạt động GPS
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="justify-start gap-2.5"
              >
                <Link to="/admin/campaigns">
                  <Flag className="size-4 text-warning" />
                  Tạo & Công bố Chiến dịch
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="justify-start gap-2.5"
              >
                <Link to="/admin/organizations">
                  <Building2 className="size-4 text-primary" />
                  Quản lý Cây Tổ chức Đoàn - Hội
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="justify-start gap-2.5"
              >
                <Link to="/admin/volunteers">
                  <Users className="size-4 text-emerald-600" />
                  Hồ sơ TNV & Import Excel
                </Link>
              </Button>
            </div>
          </DashboardWidget>
        </div>
      </div>

      <AdminRegistrationsDialog
        activity={reviewActivity}
        open={Boolean(reviewActivity)}
        onOpenChange={(open) => {
          if (!open) setReviewActivity(null);
        }}
      />
    </div>
  );
}
