import type { RefreshTokenResponse } from "@/types/auth.types";
import axios, { type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "/api" : "https://localhost:7161/api");

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

let refreshTokenPromise: Promise<RefreshTokenResponse> | null = null;

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest?.url?.includes("/auth/login") ||
      originalRequest?.url?.includes("/auth/google") ||
      originalRequest?.url?.includes("/auth/logout") ||
      originalRequest?.url?.includes("/auth/register") ||
      originalRequest?.url?.includes("/auth/refresh-token");

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      const expiredAccessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (expiredAccessToken && refreshToken) {
        try {
          if (!refreshTokenPromise) {
            refreshTokenPromise = axios
              .post<RefreshTokenResponse>(
                `${API_BASE_URL}/auth/refresh-token`,
                {
                  expiredAccessToken,
                  refreshToken,
                },
              )
              .then((res) => {
                localStorage.setItem("accessToken", res.data.accessToken);
                localStorage.setItem("refreshToken", res.data.refreshToken);
                return res.data;
              })
              .finally(() => {
                refreshTokenPromise = null;
              });
          }

          const { accessToken: newAccessToken } = await refreshTokenPromise;

          // Gắn token mới vào lại request vừa bị lỗi 401/403 và thực hiện lại nó!
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosClient(originalRequest);
        } catch (refreshError) {
          if (error.response?.status === 401) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
          }
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default axiosClient;
