import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  CalendarHeart,
  Flag,
  Home,
  ClipboardCheck,
  LayoutDashboard,
  Building2,
  Users,
  User,
  LogOut,
} from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Dùng để kiểm tra xem URL hiện tại đang ở trang nào

  const isAdmin = hasRole(["SUPER_ADMIN", "ORGANIZATION_ADMIN"]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Kiểm tra đường dẫn hiện tại để tô màu Xanh Đoàn cho mục đang đứng
  const isActivePath = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* 1. BÊN TRÁI: Logo & Tên hệ thống */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold leading-tight text-slate-900">
              Tình Nguyện Số
            </span>
            <span className="text-xs text-muted-foreground">
              Hệ thống Điều phối & Điểm danh AI
            </span>
          </div>
        </Link>

        {/* 2. Ở GIỮA: NavigationMenu của shadcn/ui */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1">
            {/* Mục 1: Trang chủ */}
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/" />}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "gap-2",
                  isActivePath("/") &&
                    "bg-primary/10 text-primary font-semibold",
                )}
              >
                <Home className="h-4 w-4" />
                <span>Trang chủ</span>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Mục 2: Hoạt động */}
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/activities" />}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "gap-2",
                  isActivePath("/activities") &&
                    "bg-primary/10 text-primary font-semibold",
                )}
              >
                <CalendarHeart className="h-4 w-4" />
                <span>Hoạt động</span>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Mục 3: Chiến dịch */}
            <NavigationMenuItem>
              <NavigationMenuLink
                render={<Link to="/campaigns" />}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "gap-2",
                  isActivePath("/campaigns") &&
                    "bg-primary/10 text-primary font-semibold",
                )}
              >
                <Flag className="h-4 w-4" />
                <span>Chiến dịch</span>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Mục 4: Hoạt động của tôi (Chỉ hiện khi đã đăng nhập) */}
            {isAuthenticated && (
              <NavigationMenuItem>
                <NavigationMenuLink
                  render={<Link to="/my-registrations" />}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "gap-2",
                    isActivePath("/my-registrations") &&
                      "bg-primary/10 text-primary font-semibold",
                  )}
                >
                  <ClipboardCheck className="h-4 w-4" />
                  <span>Hoạt động của tôi</span>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}

            {/* Mục 5: Menu Xổ Xuống "Quản trị" (Chỉ hiện khi là Admin) */}
            {isAdmin && (
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={cn(
                    "gap-2",
                    isActivePath("/admin") &&
                      "bg-primary/10 text-primary font-semibold",
                  )}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Quản trị</span>
                </NavigationMenuTrigger>

                {/* Bảng Popup xổ xuống khi rê chuột vào "Quản trị" */}
                <NavigationMenuContent>
                  <ul className="grid w-[320px] gap-1 p-2">
                    <li>
                      <NavigationMenuLink
                        render={<Link to="/admin/organizations" />}
                        className="flex flex-col items-start gap-1 rounded-md p-2.5 hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <Building2 className="h-4 w-4 text-primary" />
                          <span>Quản lý Tổ chức</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Cơ cấu Tỉnh đoàn, Đoàn trường, Liên chi đoàn
                        </p>
                      </NavigationMenuLink>
                    </li>

                    <li>
                      <NavigationMenuLink
                        render={<Link to="/admin/volunteers" />}
                        className="flex flex-col items-start gap-1 rounded-md p-2.5 hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <Users className="h-4 w-4 text-primary" />
                          <span>Quản lý Tình nguyện viên</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Hồ sơ đoàn viên & Import danh sách từ Excel
                        </p>
                      </NavigationMenuLink>
                    </li>

                    <li>
                      <NavigationMenuLink
                        render={<Link to="/admin/campaigns" />}
                        className="flex flex-col items-start gap-1 rounded-md p-2.5 hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <Flag className="h-4 w-4 text-primary" />
                          <span>Quản lý Chiến dịch</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Mùa Hè Xanh, Xuân Tình Nguyện, Chủ Nhật Xanh
                        </p>
                      </NavigationMenuLink>
                    </li>

                    <li>
                      <NavigationMenuLink
                        render={<Link to="/admin/activities" />}
                        className="flex flex-col items-start gap-1 rounded-md p-2.5 hover:bg-slate-100"
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-900">
                          <CalendarHeart className="h-4 w-4 text-primary" />
                          <span>Quản lý Hoạt động & Duyệt ĐK</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Tạo hoạt động, vùng GPS Geofence & duyệt TNV
                        </p>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* 3. BÊN PHẢI: Khu vực Tài khoản / Đăng nhập */}
        <div className="flex items-center gap-3">
          {!isAuthenticated ? (
            <>
              <Button variant="ghost" render={<Link to="/login" />}>
                Đăng nhập
              </Button>
              <Button variant="default" render={<Link to="/register" />}>
                Đăng ký
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm hover:bg-slate-100"
              >
                <User className="h-4 w-4 text-primary" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold leading-none text-slate-900">
                    {user?.username}
                  </span>
                  <span className="mt-0.5 text-[11px] text-muted-foreground">
                    {user?.organizationName || "Đoàn viên"}
                  </span>
                </div>
                {isAdmin && (
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    Admin
                  </Badge>
                )}
              </Link>

              <Button
                variant="outline"
                size="icon"
                onClick={handleLogout}
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
