import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RefreshCw } from "lucide-react";

import { dashboardApi } from "@/api/dashboardApi";
import type {
  DashboardPendingActivity,
  DashboardSchedule,
  DashboardSummary,
  DashboardTrends,
} from "@/types/dashboard.types";
import { formatDateTimeVN } from "@/lib/activity-helpers";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { AdminRegistrationsDialog } from "@/components/admin/AdminRegistrationsDialog";
import { PageHead } from "@/components/blocks/shell/page-chrome";
import { Button } from "@/components/ui/button";
import { AdminDashboardSkeleton } from "@/components/common/Skeletons";
import {
  DashboardPage,
  type DashboardNotification,
  type DashboardScheduleEvent,
  type DashboardWeekLeader,
  type StatCardProps,
} from "@/components/blocks/dashboard";

export function AdminOverviewPage() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrends | null>(null);
  const [pendingItems, setPendingItems] = useState<DashboardPendingActivity[]>(
    [],
  );
  const [schedule, setSchedule] = useState<DashboardSchedule | null>(null);

  const [reviewActivity, setReviewActivity] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryRes, trendsRes, pendingRes, scheduleRes] =
        await Promise.allSettled([
          dashboardApi.getSummary(),
          dashboardApi.getTrends(6),
          dashboardApi.getPendingApprovals(5),
          dashboardApi.getSchedule(),
        ]);

      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
      if (trendsRes.status === "fulfilled") setTrends(trendsRes.value);
      if (pendingRes.status === "fulfilled")
        setPendingItems(pendingRes.value || []);
      if (scheduleRes.status === "fulfilled") setSchedule(scheduleRes.value);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
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

  // 1. Thẻ thống kê StatCards từ /api/dashboard/summary
  const stats: StatCardProps[] = useMemo(
    () => [
      {
        label: "Đơn vị Đoàn - Hội",
        value: summary?.totalOrganizations ?? 0,
        unit: "đơn vị",
        description: "Khoa, Ban, CLB & Đội trực thuộc",
        onClick: () => navigate("/admin/organizations"),
      },
      {
        label: "Chiến dịch Tình nguyện",
        value: summary?.totalCampaigns ?? 0,
        unit: "chiến dịch",
        description: `${summary?.activeCampaigns ?? 0} đang diễn ra / sắp tới`,
        onClick: () => navigate("/admin/campaigns"),
      },
      {
        label: "Hoạt động Tình nguyện",
        value: summary?.totalActivities ?? 0,
        unit: "hoạt động",
        description: `${summary?.openOrOngoingActivities ?? 0} đang mở ĐK / diễn ra`,
        highlight: true,
        onClick: () => navigate("/admin/activities"),
      },
      {
        label: "Tình nguyện viên",
        value: summary?.totalVolunteers ?? 0,
        unit: "sinh viên",
        description: `${summary?.totalPendingRegistrations ?? 0} đơn ĐK đang chờ duyệt`,
        onClick: () => navigate("/admin/volunteers"),
      },
    ],
    [summary, navigate],
  );

  // 2. Biểu đồ xu hướng LineChart thật 6 tháng từ /api/dashboard/trends
  const chartLabels = trends?.labels ?? [];
  const chartSeries = useMemo(
    () => [
      {
        id: "activities",
        label: "Hoạt động tổ chức",
        values: trends?.activityCounts ?? [],
        tone: "primary" as const,
      },
      {
        id: "registrations",
        label: "Lượt đăng ký sinh viên",
        values: trends?.registrationCounts ?? [],
        tone: "success" as const,
      },
    ],
    [trends],
  );

  // 3. Hoạt động có đơn chờ duyệt thật từ /api/dashboard/pending-approvals
  const pending = useMemo(
    () => ({
      subtitle: "Xét duyệt nhanh danh sách sinh viên đăng ký tham gia",
      emptyTitle: "Không có hoạt động cần duyệt:",
      emptyHint:
        "Tất cả yêu cầu đăng ký tham gia tình nguyện đã được xử lý xong.",
      items: pendingItems.map((item) => ({
        id: item.activityId,
        title: item.activityName,
        subtitle: `${item.organizationName} • Khởi hành: ${formatDateTimeVN(item.startTime)}`,
        statusBadge: `${item.pendingRegistrationCount} chờ duyệt`,
        actionLabel: "Duyệt ĐK",
        onAction: () =>
          setReviewActivity({ id: item.activityId, name: item.activityName }),
      })),
      onViewAll: () => navigate("/admin/activities"),
    }),
    [pendingItems, navigate],
  );

  // 4. Lịch hoạt động tuần thật từ /api/dashboard/schedule
  const weekData = useMemo(() => {
    const leaders: DashboardWeekLeader[] = [
      {
        id: "all",
        name: "Đoàn - Hội ĐH Đồng Tháp",
        role: "Ban Chấp hành Đoàn Trường & Liên Chi đoàn",
      },
    ];

    const days = (schedule?.days ?? []).map((day) => ({
      ...day,
      events: day.events.map((ev) => ({
        id: ev.id,
        time: ev.time,
        title: ev.title,
        place: ev.place,
        leaderId: "all",
        session: ev.session,
      })),
    }));

    return {
      title: "Lịch hoạt động tình nguyện tuần",
      rangeLabel: schedule?.rangeLabel ?? "",
      days,
      leaders,
      emptyText: "Tuần này chưa có hoạt động tình nguyện nào khởi hành.",
    };
  }, [schedule]);

  // 5. Lịch hôm nay từ ngày today trong weekData
  const todayData = useMemo(() => {
    const todayObj = weekData.days.find((d) => d.today);
    const dateLabel = todayObj ? todayObj.date : "Hôm nay";
    const events: DashboardScheduleEvent[] = todayObj ? todayObj.events : [];

    return {
      dateLabel,
      events,
    };
  }, [weekData]);

  // 6. Thông báo nhanh từ danh sách đơn chờ duyệt & lịch tuần
  const notifications: DashboardNotification[] = useMemo(() => {
    if (pendingItems.length > 0) {
      return pendingItems.slice(0, 4).map((item) => ({
        id: item.activityId,
        title: `"${item.activityName}" có ${item.pendingRegistrationCount} đơn chờ duyệt`,
        sender: item.organizationName,
        time: formatDateTimeVN(item.startTime),
        unread: true,
      }));
    }

    const weekEvents = (schedule?.days ?? []).flatMap((d) => d.events);
    return weekEvents.slice(0, 4).map((ev) => ({
      id: ev.id,
      title: `Hoạt động "${ev.title}"`,
      sender: ev.organizationName,
      time: ev.time,
      unread: false,
    }));
  }, [pendingItems, schedule]);

  // Nhãn ngày hiện tại
  const currentDateLabel = useMemo(() => {
    const daysVN = [
      "Chủ Nhật",
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
    ];
    const now = new Date();
    const dayName = daysVN[now.getDay()];
    const date = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return `${dayName}, ngày ${date} tháng ${month} năm ${year} • Hệ thống Quản trị Đoàn - Hội`;
  }, []);

  return (
    <div className="space-y-6">
      <PageHead
        title="Báo cáo Tổng quan Quản trị Đoàn - Hội"
        description="Đại học Đồng Tháp (DThU) • Bảng điều khiển Quản trị viên & Cán bộ Đoàn"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw
              className={`size-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới số liệu
          </Button>
        }
      />

      {isInitialLoading ? (
        <AdminDashboardSkeleton />
      ) : (
        <DashboardPage
          dateLabel={currentDateLabel}
          stats={stats}
          chart={{
            title: "Xu hướng Hoạt động & Đăng ký Tình nguyện",
            subtitle: "Số liệu tổng hợp 6 tháng gần nhất",
            labels: chartLabels,
            series: chartSeries,
          }}
          pending={pending}
          week={weekData}
          today={todayData}
          notifications={notifications}
          onReloadWidget={() => fetchOverview()}
          onViewAllNotifications={() => navigate("/admin/activities")}
        />
      )}

      <AdminRegistrationsDialog
        activity={reviewActivity}
        open={Boolean(reviewActivity)}
        onOpenChange={(open) => {
          if (!open) {
            setReviewActivity(null);
            fetchOverview();
          }
        }}
      />
    </div>
  );
}
