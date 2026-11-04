import { useCallback, useEffect, useState } from "react";
import { organizationApi } from "@/api/organizationApi";
import type { Organization } from "@/types/auth.types";
import { AdminVolunteersTab } from "@/components/admin/AdminVolunteersTab";

export function AdminVolunteersPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const fetchOrgs = useCallback(async () => {
    try {
      const res = await organizationApi.getAll();
      setOrganizations(res || []);
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  return <AdminVolunteersTab organizations={organizations} />;
}
