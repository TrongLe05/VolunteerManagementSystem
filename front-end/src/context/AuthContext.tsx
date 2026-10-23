import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/api/authApi";
import type { LoginRequest, RoleType, UserInfo } from "@/types/auth.types";

// 1. Định nghĩa "Interface" cho AuthContext (giống ICurrentUserService ở C#)
interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: RoleType[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Provider bọc ngoài toàn bộ ứng dụng (giống đăng ký DI Scoped/Singleton trong Program.cs)
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khi người dùng F5 (tải lại trang):
  // Kiểm tra xem trong localStorage có accessToken không -> Nếu có thì gọi GET /api/auth/me để khôi phục thông tin user!
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch {
        // Nếu token hỏng và refresh cũng thất bại -> xóa rác
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Hàm Đăng nhập: gọi API -> lưu Token vào localStorage -> lưu User vào State
  const login = async (data: LoginRequest) => {
    const response = await authApi.login(data);
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);

    // Gọi thêm getMe() để lấy đầy đủ organizationId (vì LoginResponseDto chưa có organizationId)
    const fullUser = await authApi.getMe();
    setUser(fullUser);
  };

  // Hàm Đăng xuất: gọi API thu hồi RefreshToken -> xóa localStorage -> xóa State
  const logout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      if (refreshToken) {
        await authApi.logout(refreshToken);
      }
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
    }
  };

  // Hàm kiểm tra quyền (Role-based check cho Sidebar & ProtectedRoute)
  const hasRole = (allowedRoles: RoleType[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some((role) => allowedRoles.includes(role as RoleType));
  };

  return (
    <AuthContext.Provider
      value={{
            user,
            isAuthenticated: !!user,
            isLoading,
            login,
            logout,
            hasRole,
          }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 3. Custom Hook để các màn hình gọi ngắn gọn: const { user, login } = useAuth();
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng bên trong <AuthProvider>");
  }
  return context;
}
