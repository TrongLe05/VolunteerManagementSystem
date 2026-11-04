import { Link } from "react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import authBanner from "@/assets/auth-banner.jpg";

interface GuestHeroBannerProps {
  campaignCount: number;
  activityCount: number;
  organizationCount: number;
}

export function GuestHeroBanner({
  campaignCount,
  activityCount,
  organizationCount,
}: GuestHeroBannerProps) {
  return (
    <section className="relative overflow-hidden border-b bg-slate-900 text-white">
      <img
        src={authBanner}
        alt="Tuổi trẻ Đại học Đồng Tháp"
        className="absolute inset-0 h-full w-full object-cover opacity-35"
      />
      <div className="absolute inset-0 bg-linear-to-r from-blue-950/95 via-blue-900/85 to-slate-900/70" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-3.5 py-1 text-xs font-medium text-blue-200 backdrop-blur-xs">
              <Sparkles className="size-3.5 text-amber-300" />
              Đoàn TNCS Hồ Chí Minh • Trường Đại học Đồng Tháp
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl lg:leading-tight">
              Cổng Thông tin Hoạt động Tình nguyện & Điểm danh Thông minh
            </h1>
            <p className="max-w-2xl text-sm text-blue-100/90 sm:text-base leading-relaxed">
              Kết nối đoàn viên, sinh viên Trường Đại học Đồng Tháp với các
              chiến dịch tình nguyện vì cộng đồng. Tích hợp xác thực vị trí GPS
              Geofencing và nhận diện khuôn mặt AI.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                asChild
                className="bg-blue-600 text-white hover:bg-blue-500 font-semibold"
              >
                <Link to="/register">Đăng ký Tình nguyện viên</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              >
                <Link to="/login">Đăng nhập tài khoản</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:col-span-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-extrabold text-amber-300">
                {campaignCount}
              </p>
              <p className="mt-1 text-xs text-blue-100">Chiến dịch</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-extrabold text-emerald-300">
                {activityCount}
              </p>
              <p className="mt-1 text-xs text-blue-100">Hoạt động</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-sm">
              <p className="text-2xl font-extrabold text-sky-300">
                {organizationCount}
              </p>
              <p className="mt-1 text-xs text-blue-100">Cơ sở Đoàn</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
