import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import {
  Building2,
  CalendarHeart,
  ExternalLink,
  FileClock,
  Flag,
  GraduationCap,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  User,
  Users,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { dashboardSignalR } from "@/services/dashboardSignalR";
import { Badge } from "@/components/ui/badge";
import {
  AppShell,
  ShellIconButton,
  type ShellNavItem,
  type ShellShortcut,
  type ShellTab,
  type ShellUser,
} from "@/components/blocks/shell/app-shell";
import dthuLogo from "@/assets/DThU-Logo.png";

const TAB_MAP: Record<
  string,
  { id: string; label: string; icon: React.ReactNode; href: string }
> = {
  "/admin": {
    id: "dashboard",
    label: "Bảng điều khiển",
    icon: <LayoutDashboard className="size-3.5" />,
    href: "/admin",
  },
  "/admin/activities": {
    id: "activities",
    label: "Hoạt động tình nguyện",
    icon: <CalendarHeart className="size-3.5" />,
    href: "/admin/activities",
  },
  "/admin/campaigns": {
    id: "campaigns",
    label: "Chiến dịch",
    icon: <Flag className="size-3.5" />,
    href: "/admin/campaigns",
  },
  "/admin/organizations": {
    id: "organizations",
    label: "Cây đơn vị Đoàn",
    icon: <Building2 className="size-3.5" />,
    href: "/admin/organizations",
  },
  "/admin/volunteers": {
    id: "volunteers",
    label: "Tình nguyện viên",
    icon: <GraduationCap className="size-3.5" />,
    href: "/admin/volunteers",
  },
  "/admin/users": {
    id: "users",
    label: "Tài khoản & Phân quyền",
    icon: <Users className="size-3.5" />,
    href: "/admin/users",
  },
  "/admin/audit-logs": {
    id: "audit-logs",
    label: "Nhật ký hệ thống",
    icon: <FileClock className="size-3.5" />,
    href: "/admin/audit-logs",
  },
};

export function AdminLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isSuperAdmin = hasRole(["SUPER_ADMIN"]);
  const [menuExpanded, setMenuExpanded] = useState(true);

  // Khởi động kết nối SignalR thời gian thực
  useEffect(() => {
    dashboardSignalR.start();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Danh mục chức năng menu bên trái chuẩn Hành chính số DThU
  const nav: ShellNavItem[] = useMemo(
    () => [
      {
        id: "dashboard",
        label: "Bảng điều khiển",
        icon: <LayoutDashboard />,
        section: "TỔNG QUAN",
        href: "/admin",
      },
      {
        id: "activities",
        label: "Hoạt động tình nguyện",
        icon: <CalendarHeart />,
        section: "NGHIỆP VỤ ĐOÀN - HỘI",
        href: "/admin/activities",
      },
      {
        id: "campaigns",
        label: "Chiến dịch tình nguyện",
        icon: <Flag />,
        href: "/admin/campaigns",
      },
      {
        id: "organizations",
        label: "Cây đơn vị Đoàn - Hội",
        icon: <Building2 />,
        section: "QUẢN LÝ TỔ CHỨC & ĐOÀN VIÊN",
        href: "/admin/organizations",
      },
      {
        id: "volunteers",
        label: "Tình nguyện viên",
        icon: <GraduationCap />,
        href: "/admin/volunteers",
      },
      ...(isSuperAdmin
        ? [
            {
              id: "users",
              label: "Tài khoản & Phân quyền",
              icon: <Users />,
              section: "HỆ THỐNG & BẢO MẬT",
              href: "/admin/users",
            },
            {
              id: "audit-logs",
              label: "Nhật ký hệ thống",
              icon: <FileClock />,
              href: "/admin/audit-logs",
            },
          ]
        : []),
    ],
    [isSuperAdmin],
  );

  // Xác định active nav id
  const activeNav = useMemo(() => {
    if (location.pathname === "/admin") return "dashboard";
    if (location.pathname.startsWith("/admin/activities")) return "activities";
    if (location.pathname.startsWith("/admin/campaigns")) return "campaigns";
    if (location.pathname.startsWith("/admin/organizations"))
      return "organizations";
    if (location.pathname.startsWith("/admin/volunteers")) return "volunteers";
    if (location.pathname.startsWith("/admin/users")) return "users";
    if (location.pathname.startsWith("/admin/audit-logs")) return "audit-logs";
    return "dashboard";
  }, [location.pathname]);

  // Quản lý tab đang mở (Multi-tab workspace chuẩn DThU)
  const [openTabs, setOpenTabs] = useState<ShellTab[]>([
    {
      id: "dashboard",
      label: "Bảng điều khiển",
      icon: <LayoutDashboard className="size-3.5" />,
      closable: false,
    },
  ]);

  // Đồng bộ tab khi chuyển URL
  useEffect(() => {
    const currentConfig = Object.values(TAB_MAP).find(
      (item) =>
        location.pathname === item.href ||
        (item.href !== "/admin" && location.pathname.startsWith(item.href)),
    );

    if (currentConfig) {
      setOpenTabs((prev) => {
        if (prev.some((t) => t.id === currentConfig.id)) return prev;
        return [
          ...prev,
          {
            id: currentConfig.id,
            label: currentConfig.label,
            icon: currentConfig.icon,
            closable: currentConfig.id !== "dashboard",
          },
        ];
      });
    }
  }, [location.pathname]);

  const handleTabChange = (tabId: string) => {
    const target = Object.values(TAB_MAP).find((item) => item.id === tabId);
    if (target) navigate(target.href);
  };

  const handleTabClose = (tabId: string) => {
    setOpenTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (tabId === activeNav) {
        const last = next[next.length - 1];
        if (last) {
          const target = Object.values(TAB_MAP).find(
            (item) => item.id === last.id,
          );
          if (target) navigate(target.href);
        }
      }
      return next;
    });
  };

  const handleNavChange = (id: string) => {
    const target = Object.values(TAB_MAP).find((item) => item.id === id);
    if (target) navigate(target.href);
  };

  // Thông tin user hiển thị trên Header và Sidebar
  const shellUser: ShellUser = useMemo(() => {
    const username = user?.username || "Admin";
    const initials = username.trim().slice(0, 2).toUpperCase();
    return {
      name: user?.username || "Quản trị viên",
      username: user?.organizationName || "Đoàn Trường ĐH Đồng Tháp",
      initials,
    };
  }, [user]);

  // Lối tắt trên header
  const shortcuts: ShellShortcut[] = [
    {
      id: "home",
      label: "Trang chủ sinh viên",
      icon: <Home className="size-4" />,
      href: "/",
    },
  ];

  // Toolbar góc phải trên cùng
  const toolbar = (
    <div className="flex items-center gap-1.5 mr-1">
      <span
        className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200"
        title="Đang đồng bộ dữ liệu thời gian thực qua SignalR"
      >
        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        Real-time
      </span>

      <Badge
        variant="outline"
        className="hidden lg:inline-flex text-[11px] font-semibold text-blue-700 bg-blue-50 border-blue-200 mr-1"
      >
        {isSuperAdmin ? "SUPER_ADMIN" : "ORGANIZATION_ADMIN"}
      </Badge>

      <ShellIconButton
        label="Về Bảng tin sinh viên"
        onClick={() => navigate("/")}
      >
        <ExternalLink className="size-4.5" />
      </ShellIconButton>
    </div>
  );

  // User menu dropdown góc phải
  const userMenu = (
    <div className="p-1 text-xs">
      <div className="px-2 py-1.5 border-b border-border mb-1">
        <p className="font-bold text-foreground truncate">{user?.username}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {user?.organizationName || "Trường Đại học Đồng Tháp"}
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate("/profile")}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted text-left text-foreground cursor-pointer transition-colors"
      >
        <User className="size-3.5" />
        <span>Hồ sơ cá nhân</span>
      </button>
      <button
        type="button"
        onClick={() => navigate("/change-password")}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted text-left text-foreground cursor-pointer transition-colors"
      >
        <KeyRound className="size-3.5" />
        <span>Đổi mật khẩu</span>
      </button>
      <div className="border-t border-border my-1" />
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-destructive hover:bg-destructive/10 text-left font-medium cursor-pointer transition-colors"
      >
        <LogOut className="size-3.5" />
        <span>Đăng xuất</span>
      </button>
    </div>
  );

  return (
    <div className="h-screen w-screen overflow-hidden">
      <AppShell
        brand={
          <img
            src={dthuLogo}
            alt="DThU"
            className="size-8 object-contain shrink-0"
          />
        }
        brandWide={
          <div className="flex items-center gap-2.5 w-full">
            <img
              src={dthuLogo}
              alt="DThU"
              className="size-8 object-contain shrink-0"
            />
            <div className="flex flex-col min-w-0 text-left">
              <span className="font-extrabold text-xs leading-tight text-blue-950 truncate tracking-wide uppercase">
                ĐẠI HỌC ĐỒNG THÁP
              </span>
              <span className="text-[11px] font-medium text-slate-600 truncate leading-tight mt-0.5">
                Hành chính Đoàn - Hội
              </span>
            </div>
          </div>
        }
        nav={nav}
        activeNav={activeNav}
        onNavChange={handleNavChange}
        menuExpanded={menuExpanded}
        onMenuExpandedChange={setMenuExpanded}
        shortcuts={shortcuts}
        onShortcutSelect={(id) => {
          if (id === "home") navigate("/");
        }}
        toolbar={toolbar}
        userMenu={userMenu}
        user={shellUser}
        tabs={openTabs}
        activeTab={activeNav}
        onTabChange={handleTabChange}
        onTabClose={handleTabClose}
        searchPlaceholder="Tìm chức năng quản trị..."
      >
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-4">
          <Outlet />
        </div>
      </AppShell>
    </div>
  );
}
