import axiosClient from "@/api/axiosClient";
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  UserInfo,
} from "@/types/auth.types";

export const authApi = {
  //POST /auth/login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axiosClient.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  //POST /auth/register
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await axiosClient.post<RegisterResponse>(
      "/auth/register",
      data,
    );
    return response.data;
  },

  //POST /auth/logout
  logout: async (refreshToken: string): Promise<void> => {
    await axiosClient.post("/auth/logout", { refreshToken });
  },

  //GET /auth/me
  getMe: async (): Promise<UserInfo> => {
    const response = await axiosClient.get<UserInfo>("/auth/me");
    return response.data;
  },
};
