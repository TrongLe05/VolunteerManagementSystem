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

  //POST /auth/forgot-password
  forgotPassword: async (email: string): Promise<void> => {
    await axiosClient.post("/auth/forgot-password", { email });
  },

  //POST /auth/verify-otp
  verifyOtp: async (email: string, otp: string): Promise<void> => {
    await axiosClient.post("/auth/verify-otp", { email, otp });
  },

  // POST /auth/reset-password
  resetPassword: async (
    email: string,
    otp: string,
    newPassword: string,
    confirmNewPassword: string,
  ): Promise<void> => {
    await axiosClient.post("/auth/reset-password", {
      email,
      otp,
      newPassword,
      confirmNewPassword,
    });
  },

  // POST /auth/me/avatar
  updateAvatar: async (avatarFile: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append("file", avatarFile);
    const response = await axiosClient.post<{ avatarUrl: string }>(
      "/auth/me/avatar",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
