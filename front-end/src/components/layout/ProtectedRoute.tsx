import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "@/context/AuthContext";
import type { RoleType } from "@/types/auth.types";

interface ProtectedRouteProps {
  allowedRoles?: RoleType[]; // Nếu truyền vào thì kiểm tra thêm Role, không truyền thì chỉ cần đăng nhập là được
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // 1. Đang chờ gọi API /auth/me lúc mới F5 trang -> Hiện màn hình chờ
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Đang tải thông tin phiên đăng nhập...
      </div>
    );
  }

  // 2. Chưa đăng nhập -> Đá về trang /login (lưu lại trang đang định vào để login xong quay lại)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Đã đăng nhập nhưng không đủ Role (VD: VOLUNTEER đòi vào trang Admin) -> Đá về trang chủ
  if (allowedRoles && allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  // 4. Hợp lệ -> Cho phép hiển thị trang con bên trong (<Outlet />)
  return <Outlet />;
}
