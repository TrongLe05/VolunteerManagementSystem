import { useCallback, useEffect, useState } from "react";
import { activityApi } from "@/api/activityApi";
import { campaignApi } from "@/api/campaignApi";
import type { Activity, Campaign } from "@/types/volunteer.types";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { AdminActivitiesTab } from "@/components/admin/AdminActivitiesTab";

export function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const [actRes, campRes] = await Promise.all([
        activityApi.getAll({ pageNumber: 1, pageSize: 100 }),
        campaignApi.getAll({ pageNumber: 1, pageSize: 100 }),
      ]);
      setActivities(actRes.items || []);
      setCampaigns(campRes.items || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useDashboardRealtime({
    onActivityChanged: fetchData,
    onCampaignChanged: fetchData,
  });

  return (
    <AdminActivitiesTab
      activities={activities}
      campaigns={campaigns}
      onRefresh={fetchData}
    />
  );
}
