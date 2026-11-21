import axiosClient from "@/api/axiosClient";
import type { DashboardSummary } from "@/types/dashboard.types";

export const dashboardApi = {
  // GET /api/dashboard/summary
  getSummary: async () => {
    const res = await axiosClient.get<DashboardSummary>("/dashboard/summary");
    return res.data;
  },

  // GET /api/dashboard/trends
  getTrends: async (months = 6) => {
    const res = await axiosClient.get("/dashboard/trends", {
      params: { months },
    });
    return res.data;
  },

  // GET /api/dashboard/pending-approvals
  getPendingApprovals: async (limit = 5) => {
    const res = await axiosClient.get("/dashboard/pending-approvals", {
      params: { limit },
    });
    return res.data;
  },

  // GET /api/dashboard/schedule
  getSchedule: async (date?: string) => {
    const res = await axiosClient.get("/dashboard/schedule", {
      params: date ? { date } : undefined,
    });
    return res.data;
  },
};
