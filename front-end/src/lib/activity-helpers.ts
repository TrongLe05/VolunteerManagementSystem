import type { Organization, UserInfo } from "@/types/auth.types";

export function getScopedOrganizations(
  organizations: Organization[],
  user: UserInfo | null,
): Organization[] {
  if (!user || !user.organizationId) {
    return organizations;
  }

  const isSuperAdmin = user.roles?.includes("SUPER_ADMIN");
  if (isSuperAdmin) {
    return organizations;
  }

  const allowedIds = new Set<string>([user.organizationId]);
  let added = true;

  while (added) {
    added = false;
    for (const org of organizations) {
      if (
        org.parentId &&
        allowedIds.has(org.parentId) &&
        !allowedIds.has(org.id)
      ) {
        allowedIds.add(org.id);
        added = true;
      }
    }
  }

  return organizations.filter((org) => allowedIds.has(org.id));
}

export function formatDateTimeVN(isoString?: string | null) {
  if (!isoString) return "N/A";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "N/A";
    return new Intl.DateTimeFormat("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  } catch {
    return "N/A";
  }
}

export function getActivityStatusConfig(status: string) {
  switch (status) {
    case "OPEN":
    case "PUBLISHED":
      return {
        label: "Đang mở đăng ký",
        className:
          "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400",
      };
    case "UPCOMING":
      return {
        label: "Sắp diễn ra",
        className:
          "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-400",
      };
    case "ONGOING":
      return {
        label: "Đang diễn ra",
        className:
          "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
      };
    case "COMPLETED":
      return {
        label: "Đã hoàn thành",
        className: "bg-slate-500/15 text-slate-700 border-slate-500/30",
      };
    case "CANCELLED":
      return {
        label: "Đã hủy",
        className: "bg-red-500/15 text-red-700 border-red-500/30",
      };
    case "DRAFT":
      return {
        label: "Bản nháp",
        className: "bg-amber-500/15 text-amber-700 border-amber-500/30",
      };
    default:
      return {
        label: status,
        className: "bg-muted text-muted-foreground",
      };
  }
}

export function getRegistrationStatusBadge(status?: string | null) {
  switch (status) {
    case "REGISTERED":
    case "PENDING":
      return {
        label: "Đã đăng ký • Chờ duyệt",
        className: "bg-amber-500/15 text-amber-700 border-amber-500/30",
      };
    case "APPROVED":
      return {
        label: "Đã duyệt tham gia",
        className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
      };
    case "REJECTED":
      return {
        label: "Từ chối đăng ký",
        className: "bg-red-500/15 text-red-700 border-red-500/30",
      };
    default:
      return null;
  }
}
