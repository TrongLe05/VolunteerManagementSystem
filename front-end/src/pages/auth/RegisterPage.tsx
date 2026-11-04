import { Link } from "react-router";
import { ArrowLeft, Award, MapPin, ScanFace, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/components/RegisterForm";
import authBanner from "@/assets/auth-banner.jpg";

const features = [
  {
    icon: <MapPin />,
    title: "Điểm danh GPS Geofencing",
    description: "Kiểm soát tọa độ thực địa chuẩn xác",
  },
  {
    icon: <ScanFace />,
    title: "Xác thực khuôn mặt AI",
    description: "Chống gian lận theo Nghị định 13/2023/NĐ-CP",
  },
  {
    icon: <ShieldCheck />,
    title: "Tự động liên kết MSSV",
    description: "Đồng bộ dữ liệu hồ sơ đoàn viên sinh viên",
  },
  {
    icon: <Award />,
    title: "Ghi nhận thành tích số",
    description: "Tích lũy điểm rèn luyện và cấp chứng nhận",
  },
];

export function RegisterPage() {
  const wash =
    "linear-gradient(90deg,rgba(7,18,38,.76) 0%,rgba(12,38,72,.32) 62%,rgba(0,0,0,0) 100%),linear-gradient(155deg,rgba(8,20,43,.78) 0%,rgba(24,62,112,.52) 54%,rgba(48,112,175,.28) 100%)";

  return (
    <div className="relative grid min-h-dvh w-full grid-cols-[1.02fr_0.98fr] bg-background text-foreground max-lg:grid-cols-1 max-lg:bg-[#002a47]">
      {/* Cột trái (Brand Panel) đồng bộ 100% với trang đăng nhập */}
      <aside
        aria-label="Giới thiệu"
        className="relative hidden flex-col justify-end pb-28 pt-12 overflow-hidden bg-sidebar px-12 text-white lg:flex min-h-screen"
        style={{
          backgroundImage: [wash, "url(" + authBanner + ")"]
            .filter(Boolean)
            .join(","),
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative">
          <Badge className="mb-1">Trường Đại học Đồng Tháp</Badge>
          <h1 className="m-0 text-display leading-[1.2] font-extrabold tracking-[-0.015em] text-white max-xl:text-[28px] [&_span]:block [&_span]:text-[#7fd4ff]">
            Hệ thống Quản lý Hoạt động tình nguyện
          </h1>
          <p className="mt-3.5 mb-0 max-w-[34ch] text-emph [text-wrap:pretty] text-[#cfe4f4]">
            Tuổi trẻ Đại học Đồng Tháp xung kích, tình nguyện vì cộng đồng.
          </p>
          <ul className="m-0 mt-[26px] grid list-none gap-[11px] p-0">
            {features.map((f) => (
              <li
                key={f.title}
                className="flex items-center gap-[11px] text-sm text-[#e2eff9]"
              >
                {f.icon ? (
                  <span className="shrink-0 text-[#7fd4ff] [&_svg]:size-[18px]">
                    {f.icon}
                  </span>
                ) : null}
                <span>
                  {f.title}
                  {f.description ? (
                    <span className="ml-1.5 text-[#9dbdd6]">
                      · {f.description}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="absolute bottom-[46px] left-12 m-0 text-xs text-[#9dbdd6]">
          © 2026 Đoàn Thanh niên - Hội Sinh viên Trường Đại học Đồng Tháp
        </p>
      </aside>

      {/* Cột phải (Vùng Form) tái sử dụng RegisterForm */}
      <section className="grid min-h-screen content-center justify-items-center bg-background px-[34px] py-10 max-lg:bg-transparent max-lg:px-6 max-sm:px-4 max-sm:py-7 overflow-y-auto">
        {/* Nút quay về trang chủ */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="absolute top-4 right-4 z-20 gap-1.5 bg-background/80 backdrop-blur"
        >
          <Link to="/">
            <ArrowLeft className="size-4" />
            Trang chủ
          </Link>
        </Button>

        {/* Tái sử dụng RegisterForm */}
        <RegisterForm />
      </section>
    </div>
  );
}
