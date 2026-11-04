import { Award, MapPin, ScanFace, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import authBanner from "@/assets/auth-banner.jpg";
import type { AuthBrandProps } from "./parts";

export const defaultAuthFeatures = [
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

export const defaultAuthBrand: AuthBrandProps = {
  brand: <Logo />,
  org: "Trường Đại học Đồng Tháp",
  headline: "Hệ thống Quản lý Hoạt động tình nguyện",
  description: "Tuổi trẻ Đại học Đồng Tháp xung kích, tình nguyện vì cộng đồng.",
  features: defaultAuthFeatures,
  footer: "© 2026 Đoàn Thanh niên - Hội Sinh viên Trường Đại học Đồng Tháp",
  backgroundImage: `url(${authBanner})`,
  brandAlign: "bottom",
};
