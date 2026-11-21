export interface DashboardSummary {
  totalOrganizations: number;
  totalCampaigns: number;
  activeCampaigns: number;
  totalActivities: number;
  openOrOngoingActivities: number;
  totalVolunteers: number;
  totalPendingRegistrations: number;
}

export interface DashboardTrends {
  labels: string[];
  activityCounts: number[];
  registrationCounts: number[];
}

export interface DashboardPendingActivity {
  activityId: string;
  activityName: string;
  campaignName: string;
  organizationName: string;
  startTime: string;
  status: string;
  pendingRegistrationCount: number;
  approvedRegistrationCount: number;
  capacity?: number | null;
}

export interface DashboardScheduleEvent {
  id: string;
  time: string;
  title: string;
  place: string;
  status: string;
  organizationName: string;
  campaignName: string;
  startTime: string;
  endTime: string;
  session: "S" | "C";
}

export interface DashboardScheduleDay {
  id: string;
  label: string;
  date: string;
  today: boolean;
  past: boolean;
  weekend: boolean;
  events: DashboardScheduleEvent[];
}

export interface DashboardSchedule {
  rangeLabel: string;
  weekStart: string;
  weekEnd: string;
  days: DashboardScheduleDay[];
}
