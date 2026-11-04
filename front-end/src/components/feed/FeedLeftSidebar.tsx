import { Link } from "react-router";
import {
  Award,
  Building2,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Hash,
  Settings,
} from "lucide-react";
import type { Organization, UserInfo } from "@/types/auth.types";
import type { VolunteerProfile } from "@/types/volunteer.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import huyHieuDoan from "@/assets/HuyHieuDoan.png";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface FeedLeftSidebarProps {
  isAuthenticated: boolean;
  isVolunteer: boolean;
  user: UserInfo | null;
  profile: VolunteerProfile | null;
  totalDays: number;
  totalRegistered: number;
  organizations: Organization[];
  selectedOrgId: string | null;
  onSelectOrg: (orgId: string | null) => void;
}

export function FeedLeftSidebar({
  isAuthenticated,
  isVolunteer,
  user,
  profile,
  totalDays,
  totalRegistered,
  organizations,
  selectedOrgId,
  onSelectOrg,
}: FeedLeftSidebarProps) {
  const displayName = profile?.fullName || user?.username || "Tình nguyện viên";
  const initials =
    displayName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "TN";

  return (
    <aside className="hidden lg:block lg:col-span-3">
      <div className="sticky top-22 space-y-4">
        {isAuthenticated ? (
          <Card className="overflow-hidden border-slate-200/90 bg-white shadow-xs">
            {/* Header Banner với gradient và họa tiết tinh tế */}
            <div className="relative h-20 bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 overflow-hidden">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
              <div className="absolute -right-4 -bottom-6 size-24 rounded-full bg-white/10 blur-xs pointer-events-none" />
            </div>

            <CardContent className="space-y-4 px-4 pb-4 pt-0">
              {/* Avatar + Nút tắt vào trang Hồ sơ */}
              <div className="relative -mt-10 flex items-end justify-between">
                <div className="relative">
                  <Avatar className="size-16 rounded-2xl border-4 border-white bg-white shadow-md ring-1 ring-slate-100">
                    <AvatarImage
                      src={user?.avatarUrl || ""}
                      alt={displayName}
                      className="rounded-xl object-cover"
                    />
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-bold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-white bg-emerald-500 shadow-xs"
                    title="Đang hoạt động"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-blue-600 gap-1 rounded-lg"
                >
                  <Link to="/profile">
                    <Settings className="size-3.5" />
                    <span>Hồ sơ</span>
                  </Link>
                </Button>
              </div>

              {/* Thông tin Họ tên, MSSV và Lớp học */}
              <div className="space-y-1.5">
                <h3 className="font-bold text-slate-900 text-base leading-tight truncate">
                  {displayName}
                </h3>

                <div className="flex flex-wrap items-center gap-1.5">
                  {profile?.studentCode ? (
                    <Badge
                      variant="outline"
                      className="bg-slate-50 text-[11px] font-medium text-slate-700 border-slate-200 px-2 py-0.5 gap-1"
                    >
                      <Hash className="size-3 text-slate-400" />
                      {profile.studentCode}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                  )}

                  {profile?.className && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50/80 text-[11px] font-medium text-blue-700 border-blue-200/80 px-2 py-0.5 gap-1"
                    >
                      <GraduationCap className="size-3 text-blue-600" />
                      {profile.className}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Hộp thông tin Đơn vị trực thuộc */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shadow-2xs">
                    <Building2 className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Đơn vị trực thuộc
                    </p>
                    <p
                      className="truncate text-xs font-semibold text-slate-800"
                      title={
                        profile?.organizationName ||
                        user?.organizationName ||
                        "Trường Đại học Đồng Tháp"
                      }
                    >
                      {profile?.organizationName ||
                        user?.organizationName ||
                        "Trường Đại học Đồng Tháp"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Thống kê và Nút điều hướng */}
              {isVolunteer && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="group rounded-xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 p-2.5 transition-all hover:shadow-xs">
                      <div className="flex items-center justify-between text-emerald-600 mb-1">
                        <span className="text-[11px] font-medium text-emerald-800">
                          Ngày tích lũy
                        </span>
                        <Award className="size-4 opacity-80" />
                      </div>
                      <p className="text-xl font-black text-emerald-700">
                        {totalDays}
                        <span className="text-xs font-normal text-emerald-600 ml-1">
                          ngày
                        </span>
                      </p>
                    </div>

                    <div className="group rounded-xl border border-blue-200/70 bg-gradient-to-br from-blue-50/80 to-blue-100/30 p-2.5 transition-all hover:shadow-xs">
                      <div className="flex items-center justify-between text-blue-600 mb-1">
                        <span className="text-[11px] font-medium text-blue-800">
                          HĐ đăng ký
                        </span>
                        <CalendarCheck className="size-4 opacity-80" />
                      </div>
                      <p className="text-xl font-black text-blue-700">
                        {totalRegistered}
                        <span className="text-xs font-normal text-blue-600 ml-1">
                          HĐ
                        </span>
                      </p>
                    </div>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:from-blue-700 hover:to-indigo-700 transition-all font-medium text-xs h-9.5 rounded-lg"
                  >
                    <Link to="/my-registrations">
                      <ClipboardCheck className="size-4" />
                      <span>Quản lý hoạt động của tôi</span>
                      <ChevronRight className="ml-auto size-3.5 opacity-70" />
                    </Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <img
                  src={huyHieuDoan}
                  alt="Đoàn TNCS"
                  className="size-7 object-contain"
                />
                <CardTitle className="text-sm font-bold">
                  Dành cho Đoàn viên - Sinh viên
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Đăng nhập để đăng ký tham gia hoạt động, điểm danh GPS & AI và
                tích lũy ngày tình nguyện.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                size="sm"
                asChild
                className="w-full bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link to="/login">Đăng nhập ngay</Link>
              </Button>
              <Button size="sm" variant="outline" asChild className="w-full">
                <Link to="/register">Tạo tài khoản mới</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Building2 className="size-4 text-blue-600" />
              Đơn vị Đoàn - Hội ({organizations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 max-h-80 overflow-y-auto">
            <button
              type="button"
              onClick={() => onSelectOrg(null)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-medium transition-colors ${
                selectedOrgId === null
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>Tất cả đơn vị</span>
            </button>
            {organizations.map((org) => (
              <button
                key={org.id}
                type="button"
                onClick={() =>
                  onSelectOrg(selectedOrgId === org.id ? null : org.id)
                }
                className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${
                  selectedOrgId === org.id
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">{org.name}</span>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
