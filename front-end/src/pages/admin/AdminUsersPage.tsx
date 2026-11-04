import { useCallback, useEffect, useState } from "react";
import { organizationApi } from "@/api/organizationApi";
import type { Organization } from "@/types/auth.types";
import { AdminUsersTab } from "@/components/admin/AdminUsersTab";

export function AdminUsersPage() {
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

  return <AdminUsersTab organizations={organizations} />;
}
