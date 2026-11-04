import { Link, useLocation } from "react-router";
import {
  ArrowLeft,
  Building2,
  CalendarHeart,
  Flag,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserInfo } from "@/types/auth.types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import dthuLogo from "@/assets/DThU-Logo.png";
import huyHieuDoan from "@/assets/HuyHieuDoan.png";

export interface AdminNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    to: "/admin",
    label: "Tổng quan Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    to: "/admin/activities",
    label: "Hoạt động & Duyệt ĐK",
    icon: CalendarHeart,
  },
  {
    to: "/admin/campaigns",
    label: "Chiến dịch Tình nguyện",
    icon: Flag,
  },
  {
    to: "/admin/organizations",
    label: "Tổ chức Đoàn - Hội",
    icon: Building2,
  },
  {
    to: "/admin/volunteers",
    label: "Tình nguyện viên & Excel",
    icon: Users,
  },
  {
    to: "/admin/users",
    label: "Quản lý Tài khoản",
    icon: UserCog,
  },
];

interface AdminSidebarProps {
  user: UserInfo | null;
  isSuperAdmin: boolean;
  onLogout: () => void;
  onItemClick?: () => void;
}

export function AdminSidebar({
  user,
  isSuperAdmin,
  onLogout,
  onItemClick,
}: AdminSidebarProps) {
  const location = useLocation();
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "AD";

  const isActive = (item: AdminNavItem) => {
    if (item.exact) {
      return location.pathname === item.to;
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      {/* 1. Header Logo Hệ thống Quản trị */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
        <div className="flex items-center gap-1.5 shrink-0">
          <img
            src={huyHieuDoan}
            alt="Huy hiệu Đoàn"
            className="size-8 object-contain"
          />
          <img src={dthuLogo} alt="Logo DThU" className="size-8 object-contain" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight text-white">
            Quản trị Đoàn - Hội
          </p>
          <p className="truncate text-[11px] text-slate-400">
            Trường Đại học Đồng Tháp
          </p>
        </div>
      </div>

      {/* 2. Thông tin Phạm vi Quyền (Scope Badge) */}
      <div className="px-3 pt-3">
        <div className="rounded-xl border border-slate-800 bg-slate-800/70 p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
            <ShieldCheck className="size-4 shrink-0" />
            <span>
              {isSuperAdmin ? "Quản trị Toàn trường" : "Quản trị Cấp Đơn vị"}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-300 font-medium">
            {user?.organizationName || "Đoàn Trường ĐH Đồng Tháp"}
          </p>
        </div>
      </div>

      {/* 3. Menu Điều hướng Phân hệ */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Phân hệ Quản lý
        </p>
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <Separator className="my-4 bg-slate-800" />

        <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Lối tắt
        </p>
        <Link
          to="/"
          onClick={onItemClick}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <ArrowLeft className="size-4 shrink-0 text-emerald-400" />
          <span>Về Bảng tin Trang chủ</span>
        </Link>
      </div>

      {/* 4. Footer Tài khoản Admin */}
      <div className="border-t border-slate-800 bg-slate-950/50 p-3 space-y-2.5">
        <div className="flex items-center gap-2.5 px-1">
          <Avatar className="size-9 shrink-0 border border-slate-700">
            <AvatarImage
              src="https://github.com/shadcn.png"
              alt={user?.username || "Admin"}
            />
            <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-xs font-semibold text-white">
                {user?.username}
              </p>
              <Badge className="h-4 bg-blue-500/20 text-blue-300 border-blue-500/30 px-1.5 py-0 text-[10px]">
                {isSuperAdmin ? "SUPER" : "ADMIN"}
              </Badge>
            </div>
            <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
          </div>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={onLogout}
          className="w-full gap-2 text-xs"
        >
          <LogOut className="size-3.5" />
          Đăng xuất tài khoản
        </Button>
      </div>
    </div>
  );
}
