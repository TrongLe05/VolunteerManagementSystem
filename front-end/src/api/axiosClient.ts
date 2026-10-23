import type { RefreshTokenResponse } from "@/types/auth.types";
import axios, { type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://localhost:7161/api";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem("accessToken");

    if (accessToken && config.headers)
      config.headers["Authorization"] = `Bearer ${accessToken}`;

    return config;
  },
  (error) => Promise.reject(error),
);

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/register");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const expiredAccessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (expiredAccessToken && refreshToken) {
        try {
          const response = await axios.post<RefreshTokenResponse>(
            `${API_BASE_URL}/auth/refresh-token`,
            {
              expiredAccessToken,
              refreshToken,
            },
          );

          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data;

          // Cất cặp Token mới vào localStorage
          localStorage.setItem("accessToken", newAccessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          // Gắn token mới vào lại request vừa bị lỗi 401 và thực hiện lại nó!
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } catch (refreshError) {
          // Nếu cả Refresh Token cũng hết hạn hoặc bị thu hồi -> Xóa sạch và đưa về trang Login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
