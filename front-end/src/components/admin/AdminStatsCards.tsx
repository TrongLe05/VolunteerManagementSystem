import { StatCard } from "@/components/blocks/dashboard/stat-card";

interface AdminStatsCardsProps {
  organizationCount: number;
  campaignCount: number;
  activityCount: number;
  volunteerCount: number;
}

export function AdminStatsCards({
  organizationCount,
  campaignCount,
  activityCount,
  volunteerCount,
}: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Đơn vị trực thuộc"
        value={organizationCount}
        unit="đơn vị"
        description="Đoàn - Hội khoa phòng ban"
        reference="DTHU-ORG"
      />
      <StatCard
        label="Chiến dịch quản lý"
        value={campaignCount}
        unit="chiến dịch"
        description="Các phong trào thiện nguyện"
        reference="DTHU-CAMP"
      />
      <StatCard
        label="Hoạt động tình nguyện"
        value={activityCount}
        unit="hoạt động"
        description="Tích hợp điểm danh GPS & AI"
        reference="DTHU-ACT"
        highlight={activityCount > 0}
      />
      <StatCard
        label="Tình nguyện viên"
        value={volunteerCount}
        unit="sinh viên"
        description="Hồ sơ liên kết MSSV"
        reference="DTHU-VOL"
      />
    </div>
  );
}
