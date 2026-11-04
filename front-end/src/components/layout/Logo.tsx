import huyHieuDoan from "@/assets/HuyHieuDoan.png";
import dthuLogo from "@/assets/DThU-Logo.png";

export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <img
        src={huyHieuDoan}
        alt="Huy hiệu Đoàn"
        className="size-11 object-contain"
      />
      <img src={dthuLogo} alt="Logo DThU" className="size-11 object-contain" />
      <div className="leading-tight">
        <p className="font-bold text-sm text-foreground">
          TRƯỜNG ĐẠI HỌC ĐỒNG THÁP
        </p>
        <p className="text-xs text-muted-foreground">
          Hệ thống quản lý hoạt động tình nguyện
        </p>
      </div>
    </div>
  );
};
