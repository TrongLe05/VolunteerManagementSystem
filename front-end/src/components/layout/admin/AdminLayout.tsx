import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { ExternalLink, Menu, ShieldCheck } from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { dashboardSignalR } from "@/services/dashboardSignalR";
import { ADMIN_NAV_ITEMS, AdminSidebar } from "./AdminSidebar";
import { AvatarDropdown } from "../Avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function AdminLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuperAdmin = hasRole(["SUPER_ADMIN"]);

  useEffect(() => {
    dashboardSignalR.start();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const currentNav =
    ADMIN_NAV_ITEMS.find((item) =>
      item.exact
        ? location.pathname === item.to
        : location.pathname.startsWith(item.to),
    ) || ADMIN_NAV_ITEMS[0];

  return (
    <div className="flex min-h-screen bg-slate-100/80">
      {/* 1. Sidebar cố định bên trái cho Desktop (lg+) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-64 lg:flex-col">
        <AdminSidebar
          user={user}
          isSuperAdmin={isSuperAdmin}
          onLogout={handleLogout}
        />
      </aside>

      {/* 2. Khung nội dung bên phải (chừa lề trái lg:pl-64 cho Sidebar) */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Topbar của trang Admin */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {/* Nút mở Sidebar trên Mobile/Tablet */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden shrink-0"
                  aria-label="Mở menu quản trị"
                >
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                hideClose
                className="w-64 p-0 border-r-0"
              >
                <SheetTitle className="sr-only">Menu Quản trị</SheetTitle>
                <AdminSidebar
                  user={user}
                  isSuperAdmin={isSuperAdmin}
                  onLogout={handleLogout}
                  onItemClick={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <h1 className="truncate text-sm sm:text-base font-bold text-slate-900">
                {currentNav.label}
              </h1>
              <p className="hidden sm:block truncate text-xs text-muted-foreground">
                Phân hệ Quản trị •{" "}
                {user?.organizationName || "Đoàn Trường Đại học Đồng Tháp"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2.5">
            <span
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200"
              title="Đang đồng bộ dữ liệu thời gian thực qua SignalR"
            >
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              Real-time
            </span>

            <Badge
              variant="info"
              className="hidden md:inline-flex gap-1"
            >
              <ShieldCheck className="size-3.5" />
              {isSuperAdmin ? "SUPER_ADMIN" : "ORGANIZATION_ADMIN"}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:inline-flex gap-1.5 text-xs"
            >
              <Link to="/">
                <ExternalLink className="size-3.5" />
                Xem Bảng tin
              </Link>
            </Button>

            <AvatarDropdown
              username={user?.username}
              organizationName={user?.organizationName}
              isAdmin={true}
              onLogout={handleLogout}
            />
          </div>
        </header>

        {/* Nội dung chính của từng trang con trong /admin/* */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
