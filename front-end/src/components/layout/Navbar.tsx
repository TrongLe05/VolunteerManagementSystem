import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  CalendarHeart,
  Flag,
  Home,
  ClipboardCheck,
  LayoutDashboard,
} from "lucide-react";
import { AvatarDropdown } from "./Avatar";
import { MobileNavSheet, type NavItemConfig } from "./MobileNavSheet";
import dthuLogo from "@/assets/DThU-Logo.png";

export default function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = hasRole(["SUPER_ADMIN", "ORGANIZATION_ADMIN"]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navItems: NavItemConfig[] = [
    { to: "/", label: "Trang chủ", icon: Home, show: true },
    { to: "/activities", label: "Hoạt động", icon: CalendarHeart, show: true },
    { to: "/campaigns", label: "Chiến dịch", icon: Flag, show: true },
    {
      to: "/my-registrations",
      label: "Hoạt động của tôi",
      icon: ClipboardCheck,
      show: isAuthenticated && !isAdmin,
    },
    {
      to: "/admin",
      label: "Quản trị hệ thống",
      icon: LayoutDashboard,
      show: isAdmin,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        {/* 1. BÊN TRÁI: Hamburger Menu (Mobile/Tablet) + Logo & Tên hệ thống */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <MobileNavSheet
            navItems={navItems}
            isActivePath={isActivePath}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            user={user}
            onLogout={handleLogout}
          />

          <Link to="/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <img
              src={dthuLogo}
              alt="Logo DThU"
              className="size-8 sm:size-10 shrink-0 object-contain"
            />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs sm:text-sm xl:text-base font-bold leading-tight text-slate-900">
                Hệ thống Quản lý Hoạt động Tình nguyện
              </span>
              <span className="hidden sm:block lg:hidden xl:block truncate text-xs text-muted-foreground">
                Trường Đại học Đồng Tháp
              </span>
            </div>
          </Link>
        </div>

        {/* 2. Ở GIỮA: NavigationMenu cho màn hình lớn (lg trở lên) */}
        <NavigationMenu viewport={false} className="hidden lg:flex shrink-0">
          <NavigationMenuList className="gap-1">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.to);
                return (
                  <NavigationMenuItem key={item.to}>
                    <NavigationMenuLink
                      asChild
                      active={active}
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "h-9 gap-2 whitespace-nowrap px-3.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary data-[active]:bg-primary/10 data-[active]:text-primary"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                      )}
                    >
                      <Link to={item.to} className="inline-flex items-center gap-2">
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                );
              })}
          </NavigationMenuList>
        </NavigationMenu>

        {/* 3. BÊN PHẢI: Khu vực Tài khoản / Đăng nhập */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {!isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="px-2.5 sm:px-3 text-xs sm:text-sm"
                asChild
              >
                <Link to="/login">Đăng nhập</Link>
              </Button>
              <Button
                variant="default"
                size="sm"
                className="px-3 sm:px-4 text-xs sm:text-sm"
                asChild
              >
                <Link to="/register">Đăng ký</Link>
              </Button>
            </>
          ) : (
            <AvatarDropdown
              username={user?.username}
              avatarUrl={user?.avatarUrl}
              organizationName={user?.organizationName}
              isAdmin={isAdmin}
              onLogout={handleLogout}
            />
          )}
        </div>
      </div>
    </header>
  );
}
