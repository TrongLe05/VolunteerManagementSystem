import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
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
  Home,
  ClipboardCheck,
  LayoutDashboard,
  Search,
  X,
} from "lucide-react";
import { AvatarDropdown } from "./Avatar";
import { MobileNavSheet, type NavItemConfig } from "./MobileNavSheet";
import dthuLogo from "@/assets/DThU-Logo.png";
import { Input } from "../ui/input";

export default function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQuery = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(urlQuery);

  useEffect(() => {
    setSearchTerm(urlQuery);
  }, [urlQuery]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    if (location.pathname === "/") {
      const nextParams = new URLSearchParams(searchParams);
      if (val.trim()) {
        nextParams.set("q", val);
      } else {
        nextParams.delete("q");
      }
      setSearchParams(nextParams, { replace: true });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      navigate(
        searchTerm.trim()
          ? `/?q=${encodeURIComponent(searchTerm.trim())}`
          : "/",
      );
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    if (location.pathname === "/") {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("q");
      setSearchParams(nextParams, { replace: true });
    }
  };

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
      <div className="relative mx-auto flex h-16 max-w-8xl items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
        {/* 1. BÊN TRÁI: Hamburger Menu (Mobile/Tablet) + Logo & Ô tìm kiếm */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3 flex-1 max-w-sm sm:max-w-md">
          <MobileNavSheet
            navItems={navItems}
            isActivePath={isActivePath}
            isAuthenticated={isAuthenticated}
            isAdmin={isAdmin}
            user={user}
            onLogout={handleLogout}
          />

          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <img
              src={dthuLogo}
              alt="Logo DThU"
              className="size-8 sm:size-10 object-contain"
            />
          </Link>

          {/* Ô tìm kiếm ở navigation bar (ẩn trên mobile, chỉ hiện từ tablet/desktop sm trở lên) */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative hidden sm:block flex-1 min-w-[140px] max-w-xs"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-9 w-full rounded-full bg-slate-100/90 pl-9 pr-8 text-xs sm:text-sm border-slate-200 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-blue-600 transition-all shadow-2xs"
              placeholder="Tìm kiếm hoạt động..."
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X className="size-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* 2. Ở GIỮA: NavigationMenu cho màn hình lớn (lg trở lên) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:flex items-center">
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
                          "h-13 gap-2 whitespace-nowrap px-3.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:text-primary data-[active]:bg-primary/10 data-[active]:text-primary"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                        )}
                      >
                        <Link
                          to={item.to}
                          className="flex flex-col items-center "
                        >
                          <Icon className="size-5 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

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
