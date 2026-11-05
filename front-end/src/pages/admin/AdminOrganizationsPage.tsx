import { useCallback, useEffect, useState } from "react";
import { organizationApi } from "@/api/organizationApi";
import type { Organization } from "@/types/auth.types";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { AdminOrganizationsTab } from "@/components/admin/AdminOrganizationsTab";

export function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await organizationApi.getAll();
      setOrganizations(res || []);
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
    onOrganizationChanged: fetchData,
  });

  return (
    <AdminOrganizationsTab
      organizations={organizations}
      isLoading={isLoading}
      onRefresh={fetchData}
    />
  );
}
