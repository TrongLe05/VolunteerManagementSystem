import { useCallback, useEffect, useState } from "react";
import { campaignApi } from "@/api/campaignApi";
import { organizationApi } from "@/api/organizationApi";
import type { Organization } from "@/types/auth.types";
import type { Campaign } from "@/types/volunteer.types";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { AdminCampaignsTab } from "@/components/admin/AdminCampaignsTab";

export function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [campRes, orgRes] = await Promise.all([
        campaignApi.getAll({ pageNumber: 1, pageSize: 100 }),
        organizationApi.getAll(),
      ]);
      setCampaigns(campRes.items || []);
      setOrganizations(orgRes || []);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useDashboardRealtime({
    onCampaignChanged: fetchData,
    onOrganizationChanged: fetchData,
  });

  return (
    <AdminCampaignsTab
      campaigns={campaigns}
      organizations={organizations}
      onRefresh={fetchData}
      isLoading={isLoading}
    />
  );
}
