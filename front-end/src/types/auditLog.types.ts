export type AuditActorType = "USER" | "SYSTEM" | "ANONYMOUS";

export interface AuditLogItem {
  id: string;
  userId: string | null;
  userEmail: string | null;
  actorType?: AuditActorType | string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: string | null;
  newValues: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface GetAuditLogsParams {
  entityType?: string;
  action?: string;
  actorType?: string;
  userId?: string;
  entityId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  pageNumber?: number;
  pageSize?: number;
}
