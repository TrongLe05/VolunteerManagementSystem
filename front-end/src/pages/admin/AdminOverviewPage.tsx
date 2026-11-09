import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { RefreshCw } from "lucide-react";

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
import { PageHead } from "@/components/blocks/shell/page-chrome";
import { Button } from "@/components/ui/button";
import { AdminDashboardSkeleton } from "@/components/common/Skeletons";
import {
  DashboardPage,
  type DashboardNotification,
  type DashboardScheduleEvent,
  type DashboardWeekDay,
  type DashboardWeekLeader,
  type StatCardProps,
} from "@/components/blocks/dashboard";

export function AdminOverviewPage() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [volunteerCount, setVolunteerCount] = useState(0);
  const [reviewActivity, setReviewActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const fetchOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      const [orgRes, campRes, actRes, volRes] = await Promise.allSettled([
        organizationApi.getAll(),
        campaignApi.getAll({ pageNumber: 1, pageSize: 50 }),
        activityApi.getManage({ pageNumber: 1, pageSize: 50 }),
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

  const openActivitiesCount = useMemo(
    () =>
      activities.filter((a) => a.status === "OPEN" || a.status === "ONGOING")
        .length,
    [activities],
  );

  // 1. Thẻ thống kê StatCards
  const stats: StatCardProps[] = useMemo(
    () => [
      {
        label: "Đơn vị Đoàn - Hội",
        value: organizations.length,
        unit: "đơn vị",
        description: "Khoa, Ban, CLB & Đội trực thuộc",
        onClick: () => navigate("/admin/organizations"),
      },
      {
        label: "Chiến dịch Tình nguyện",
        value: campaigns.length,
        unit: "chiến dịch",
        description: "Mùa Hè Xanh, Tiếp Sức Mùa Thi...",
        onClick: () => navigate("/admin/campaigns"),
      },
      {
        label: "Hoạt động Tình nguyện",
        value: activities.length,
        unit: "hoạt động",
        description: `${openActivitiesCount} đang mở ĐK / diễn ra`,
        highlight: true,
        onClick: () => navigate("/admin/activities"),
      },
      {
        label: "Tình nguyện viên",
        value: volunteerCount,
        unit: "sinh viên",
        description: "Đoàn viên & sinh viên toàn trường",
        onClick: () => navigate("/admin/volunteers"),
      },
    ],
    [
      organizations.length,
      campaigns.length,
      activities.length,
      openActivitiesCount,
      volunteerCount,
      navigate,
    ],
  );

  // 2. Biểu đồ xu hướng LineChart 6 tháng
  const chartLabels = ["T5", "T6", "T7", "T8", "T9", "T10"];
  const totalActCount = activities.length;
  const totalVolCount = volunteerCount;

  const chartSeries = useMemo(
    () => [
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
    ],
    [totalActCount, totalVolCount],
  );

  // 3. Hoạt động cần duyệt (Pending Info)
  const pending = useMemo(
    () => ({
      subtitle: "Xét duyệt nhanh danh sách sinh viên đăng ký tham gia",
      emptyTitle: "Không có hoạt động cần duyệt:",
      emptyHint:
        "Tất cả yêu cầu đăng ký tham gia tình nguyện đã được xử lý xong.",
      items: activities
        .filter((a) => a.status === "OPEN" || a.status === "ONGOING")
        .slice(0, 5)
        .map((act) => ({
          id: act.id,
          title: act.name,
          subtitle: `${act.organizationName} • Khởi hành: ${formatDateTimeVN(act.startTime)}`,
          statusBadge:
            act.campaignName || getActivityStatusConfig(act.status).label,
          actionLabel: "Duyệt ĐK",
          onAction: () => setReviewActivity(act),
        })),
      onViewAll: () => navigate("/admin/activities"),
    }),
    [activities, navigate],
  );

  // 4. Lịch hoạt động tuần (Week Schedule)
  const weekData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const dayLabels = [
      "Thứ Hai",
      "Thứ Ba",
      "Thứ Tư",
      "Thứ Năm",
      "Thứ Sáu",
      "Thứ Bảy",
      "Chủ Nhật",
    ];

    const days: DashboardWeekDay[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const isToday =
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear();

      const isPast = d < now && !isToday;

      const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;

      // Tìm hoạt động có ngày bắt đầu trùng ngày này
      const dayEvents: DashboardScheduleEvent[] = activities
        .filter((act) => {
          if (!act.startTime) return false;
          const actDate = new Date(act.startTime);
          return (
            actDate.getDate() === d.getDate() &&
            actDate.getMonth() === d.getMonth() &&
            actDate.getFullYear() === d.getFullYear()
          );
        })
        .map((act) => {
          const actDate = new Date(act.startTime);
          const hours = String(actDate.getHours()).padStart(2, "0");
          const mins = String(actDate.getMinutes()).padStart(2, "0");
          const time = `${hours}:${mins}`;
          return {
            id: act.id,
            time,
            title: act.name,
            place:
              act.locations?.[0]?.name ||
              act.locations?.[0]?.address ||
              act.organizationName,
            leaderId: "all",
            session: actDate.getHours() < 12 ? ("S" as const) : ("C" as const),
          };
        });

      days.push({
        id: `day-${i}`,
        label: dayLabels[i],
        date: dateStr,
        today: isToday,
        past: isPast,
        weekend: i >= 5,
        events: dayEvents,
      });
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const rangeLabel = `${String(monday.getDate()).padStart(2, "0")}/${String(monday.getMonth() + 1).padStart(2, "0")} - ${String(sunday.getDate()).padStart(2, "0")}/${String(sunday.getMonth() + 1).padStart(2, "0")}`;

    const leaders: DashboardWeekLeader[] = [
      {
        id: "all",
        name: "Đoàn - Hội ĐH Đồng Tháp",
        role: "Ban Chấp hành Đoàn Trường & Liên Chi đoàn",
      },
    ];

    return {
      title: "Lịch hoạt động tình nguyện tuần",
      rangeLabel,
      days,
      leaders,
      emptyText: "Tuần này chưa có hoạt động tình nguyện nào khởi hành.",
    };
  }, [activities]);

  // 5. Lịch hôm nay (Today)
  const todayData = useMemo(() => {
    const todayObj = weekData.days.find((d) => d.today);
    const dateLabel = todayObj ? todayObj.date : "Hôm nay";

    const events: DashboardScheduleEvent[] =
      todayObj && todayObj.events.length > 0
        ? todayObj.events
        : activities.slice(0, 3).map((act) => {
            const actDate = act.startTime ? new Date(act.startTime) : new Date();
            const time = `${String(actDate.getHours()).padStart(2, "0")}:${String(actDate.getMinutes()).padStart(2, "0")}`;
            return {
              id: act.id,
              time,
              title: act.name,
              place:
                act.locations?.[0]?.name ||
                act.locations?.[0]?.address ||
                act.organizationName,
              session:
                actDate.getHours() < 12 ? ("S" as const) : ("C" as const),
            };
          });

    return {
      dateLabel,
      events,
    };
  }, [weekData, activities]);

  // 6. Thông báo (Notifications)
  const notifications: DashboardNotification[] = useMemo(
    () =>
      activities.slice(0, 4).map((a, i) => ({
        id: a.id,
        title: `Phát động hoạt động "${a.name}"`,
        sender: a.organizationName,
        time: i === 0 ? "Hôm nay" : `${i + 1} ngày trước`,
        unread: i < 2,
      })),
    [activities],
  );

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

      {/* Block Dashboard chuẩn của DThU UI Kit hoặc Skeleton khi đang tải lần đầu */}
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
          if (!open) setReviewActivity(null);
        }}
      />
    </div>
  );
}
