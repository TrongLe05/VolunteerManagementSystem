"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  Settings,
  LayoutDashboard,
  CircleUser,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router";

interface AvatarDropdownProps {
  username?: string;
  avatarUrl?: string;
  organizationName?: string | null;
  isAdmin?: boolean;
  onLogout: () => void;
}

export function AvatarDropdown({
  username,
  avatarUrl,
  organizationName,
  isAdmin,
  onLogout,
}: AvatarDropdownProps) {
  const initials = username ? username.slice(0, 2).toUpperCase() : "TN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full sm:rounded-xl border border-slate-200 bg-slate-50/80 p-1 sm:px-2.5 sm:py-1.5 text-sm transition-colors hover:bg-slate-100 focus:outline-none">
        <Avatar className="size-8 shrink-0">
          <AvatarImage
            src={avatarUrl || "https://github.com/shadcn.png"}
            alt={username || "Avatar"}
          />
          <AvatarFallback className="text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="hidden sm:flex flex-col text-left max-w-[120px] xl:max-w-[160px]">
          <span className="truncate font-semibold leading-tight text-slate-900 text-xs">
            {username}
          </span>
          <span className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
            {organizationName || "Đoàn viên"}
          </span>
        </div>

        {isAdmin && (
          <Badge
            variant="secondary"
            className="hidden md:inline-flex text-[10px] px-1.5 py-0 h-4 shrink-0"
          >
            Admin
          </Badge>
        )}

        <ChevronDown className="hidden sm:block size-3.5 text-slate-400 shrink-0" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold leading-none truncate">
                  {username}
                </p>
                {isAdmin && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4"
                  >
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-none text-muted-foreground truncate">
                {organizationName || "Đoàn viên"}
              </p>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link to="/profile" className="flex items-center">
              <CircleUser className="mr-2 h-4 w-4" /> Thông tin tài khoản
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link to="/admin" className="flex items-center">
                <LayoutDashboard className="mr-2 h-4 w-4" /> Quản trị (Admin)
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" /> Cài đặt
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem variant="destructive" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Đăng xuất
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
