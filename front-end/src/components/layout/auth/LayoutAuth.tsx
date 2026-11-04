import authBanner from "@/assets/auth-banner.jpg";
import huyHieuDoan from "@/assets/HuyHieuDoan.png";
import dthuLogo from "@/assets/DThU-Logo.png";

import { Link } from "react-router";

export const LayoutAuth = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        {/* 1. Phần Logo Mobile: Đặt ở ngoài cùng -> Luôn nằm cố định ở ĐẦU TRANG */}
        <div className="flex justify-center md:justify-start lg:hidden">
          <Link to="/" className="flex items-center gap-3 font-medium">
            <div className="flex items-center justify-center gap-1.5 shrink-0">
              <img
                src={huyHieuDoan}
                alt="Huy hiệu đoàn"
                className="size-10 object-contain"
              />
              <img
                src={dthuLogo}
                alt="Logo DThU"
                className="size-10 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-bold leading-tight text-foreground">
                Hệ thống Quản lý Hoạt động Tình nguyện
              </span>
              <span className="text-xs text-muted-foreground">
                Trường Đại học Đồng Tháp
              </span>
            </div>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:flex lg:flex-col lg:justify-between p-10 overflow-hidden">
        <img
          src={authBanner}
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />

        <div className="absolute inset-0 bg-black/25 " />

        <div className="relative z-10 bottom-0 space-y-2 max-w-lg flex text-white justify-start">
          <Link to="/" className="flex items-center gap-4 font-medium ">
            <div className="flex items-center justify-center gap-2">
              <img
                src={huyHieuDoan}
                alt="Huy hiệu đoàn"
                className="size-12 object-contain"
              />
              <img
                src={dthuLogo}
                alt="Logo DThU "
                className="size-12 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold leading-tight drop-shadow">
                Hệ thống Quản lý Hoạt động Tình nguyện
              </span>
              <span className="text-xs text-white/85">
                Trường Đại học Đồng Tháp
              </span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 text-white space-y-2 max-w-lg">
          <span className="inline-block rounded-full bg-blue-600/80 backdrop-blur-sm px-3 py-1 text-xs font-medium">
            Đoàn TNCS Hồ Chí Minh - Trường ĐH Đồng Tháp
          </span>
          <h2 className="text-2xl font-bold leading-snug">
            Tuổi trẻ Đại học Đồng Tháp xung kích, tình nguyện vì cộng đồng
          </h2>
          <p className="text-sm text-white/80">
            Hệ thống quản lý hoạt động tình nguyện và điểm danh thông minh bằng
            GPS & AI.
          </p>
        </div>
      </div>
    </div>
  );
};
