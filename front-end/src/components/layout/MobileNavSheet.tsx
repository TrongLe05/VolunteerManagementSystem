import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import {
  CircleUser,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  X,
  type LucideIcon,
} from "lucide-react";

import type { UserInfo } from "@/types/auth.types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import dthuLogo from "@/assets/DThU-Logo.png";
import { Input } from "../ui/input";

export interface NavItemConfig {
  to: string;
  label: string;
  icon: LucideIcon;
  show: boolean;
}

interface MobileNavSheetProps {
  navItems: NavItemConfig[];
  isActivePath: (path: string) => boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: UserInfo | null;
  onLogout: () => void;
}

export function MobileNavSheet({
  navItems,
  isActivePath,
  isAuthenticated,
  isAdmin,
  user,
  onLogout,
}: MobileNavSheetProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentQuery = searchParams.get("q") || "";
  const [mobileQuery, setMobileQuery] = useState(currentQuery);

  useEffect(() => {
    if (open) {
      setMobileQuery(currentQuery);
    }
  }, [open, currentQuery]);

  const handleMobileSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(mobileQuery.trim())}`);
    } else {
      navigate("/");
    }
    setOpen(false);
  };
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "TN";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden shrink-0"
          aria-label="Mở menu điều hướng"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="flex w-76 flex-col p-0 sm:max-w-xs">
        <SheetHeader className="border-b bg-slate-50/70 p-4 text-left">
          <div className="flex items-center gap-3 pr-6">
            <img
              src={dthuLogo}
              alt="Logo DThU"
              className="size-10 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <SheetTitle className="text-sm font-bold leading-snug text-slate-900">
                Tình nguyện DThU
              </SheetTitle>
              <SheetDescription className="truncate text-xs">
                Trường Đại học Đồng Tháp
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {/* Thông tin tài khoản trên Mobile */}
          {isAuthenticated && user && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10 shrink-0">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt={user.username}
                  />
                  <AvatarFallback className="text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {user.username}
                    </p>
                    {isAdmin && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 py-0 text-[10px]"
                      >
                        Admin
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground mt-0.5">
                    {user.organizationName || "Đoàn viên"}
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Ô tìm kiếm dành riêng cho Mobile Menu */}
          <div className="px-1">
            <form onSubmit={handleMobileSearch} className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <Input
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value)}
                placeholder="Tìm kiếm hoạt động tình nguyện..."
                className="h-10 w-full rounded-xl bg-slate-100 pl-9.5 pr-8 text-xs border-slate-200 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-blue-600 shadow-2xs"
                type="search"
              />
              {mobileQuery && (
                <button
                  type="button"
                  onClick={() => setMobileQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  title="Xóa tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Danh mục điều hướng chính */}
          <div className="space-y-1">
            <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Điều hướng
            </p>
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon;
                const active = isActivePath(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </div>

          {/* Tiện ích tài khoản khi đã đăng nhập */}
          {isAuthenticated && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tài khoản
                </p>
                <Link
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <CircleUser className="size-4 shrink-0" />
                  <span>Thông tin tài khoản</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <LayoutDashboard className="size-4 shrink-0" />
                    <span>Quản trị (Admin)</span>
                  </Link>
                )}
                <Link
                  to="/settings"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  <Settings className="size-4 shrink-0" />
                  <span>Cài đặt</span>
                </Link>
              </div>
            </>
          )}
        </div>

        <SheetFooter className="border-t bg-slate-50/60 p-4">
          {!isAuthenticated ? (
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="outline" asChild onClick={() => setOpen(false)}>
                <Link to="/login">Đăng nhập</Link>
              </Button>
              <Button variant="default" asChild onClick={() => setOpen(false)}>
                <Link to="/register">Đăng ký</Link>
              </Button>
            </div>
          ) : (
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              <LogOut className="size-4" />
              Đăng xuất
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
