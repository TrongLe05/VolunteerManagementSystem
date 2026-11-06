import axiosClient from "@/api/axiosClient";
import type { PageResult } from "@/types/volunteer.types";
import type { AuditLogItem, GetAuditLogsParams } from "@/types/auditLog.types";

export const auditLogApi = {
  getAll: async (params?: GetAuditLogsParams): Promise<PageResult<AuditLogItem>> => {
    const response = await axiosClient.get<PageResult<AuditLogItem>>("/audit-logs", {
      params,
    });
    return response.data;
  },
};
