import { describe, it, expect, vi, beforeEach } from "vitest";
import { authApi } from "@/api/authApi";
import axiosClient from "@/api/axiosClient";

vi.mock("@/api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("authApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("login sends credentials to POST /auth/login and returns tokens", async () => {
    const mockResponse = {
      accessToken: "jwt-access-token",
      refreshToken: "refresh-token-123",
      tokenType: "Bearer",
      expiresIn: 86400,
      user: {
        id: "user-1",
        username: "sv002241",
        email: "sv002241@dthu.edu.vn",
        organizationName: "Đoàn Trường ĐH Đồng Tháp",
        roles: ["VOLUNTEER"],
      },
    };
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: mockResponse });

    const result = await authApi.login({
      usernameOrEmail: "sv002241",
      password: "Password@123",
    });

    expect(axiosClient.post).toHaveBeenCalledWith("/auth/login", {
      usernameOrEmail: "sv002241",
      password: "Password@123",
    });
    expect(result.accessToken).toBe("jwt-access-token");
    expect(result.user.username).toBe("sv002241");
  });

  it("register sends payload to POST /auth/register", async () => {
    const mockResponse = { userId: "user-new", email: "new@dthu.edu.vn" };
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: mockResponse });

    const payload = {
      username: "newuser",
      email: "new@dthu.edu.vn",
      password: "Password@123",
      organizationId: "org-1",
    };
    const result = await authApi.register(payload);

    expect(axiosClient.post).toHaveBeenCalledWith("/auth/register", payload);
    expect(result).toEqual(mockResponse);
  });

  it("getMe fetches current user info from GET /auth/me", async () => {
    const mockUser = {
      id: "user-1",
      username: "sv002241",
      email: "sv002241@dthu.edu.vn",
      organizationName: "Đoàn Khoa CNTT",
      roles: ["VOLUNTEER"],
    };
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockUser });

    const result = await authApi.getMe();

    expect(axiosClient.get).toHaveBeenCalledWith("/auth/me");
    expect(result).toEqual(mockUser);
  });

  it("logout sends refreshToken to POST /auth/logout", async () => {
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: undefined });

    await authApi.logout("refresh-token-xyz");

    expect(axiosClient.post).toHaveBeenCalledWith("/auth/logout", {
      refreshToken: "refresh-token-xyz",
    });
  });

  it("updateAvatar uploads FormData with multipart/form-data header", async () => {
    const mockResponse = { avatarUrl: "/uploads/avatars/face_1.jpg" };
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: mockResponse });

    const file = new File(["dummy-image"], "selfie.jpg", { type: "image/jpeg" });
    const result = await authApi.updateAvatar(file);

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/auth/me/avatar",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    expect(result.avatarUrl).toBe("/uploads/avatars/face_1.jpg");
  });

  it("forgotPassword, verifyOtp, and resetPassword call their respective endpoints", async () => {
    vi.mocked(axiosClient.post).mockResolvedValue({ data: undefined });

    await authApi.forgotPassword("sv@dthu.edu.vn");
    expect(axiosClient.post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "sv@dthu.edu.vn",
    });

    await authApi.verifyOtp("sv@dthu.edu.vn", "123456");
    expect(axiosClient.post).toHaveBeenCalledWith("/auth/verify-otp", {
      email: "sv@dthu.edu.vn",
      otp: "123456",
    });

    await authApi.resetPassword("sv@dthu.edu.vn", "123456", "NewPass@1", "NewPass@1");
    expect(axiosClient.post).toHaveBeenCalledWith("/auth/reset-password", {
      email: "sv@dthu.edu.vn",
      otp: "123456",
      newPassword: "NewPass@1",
      confirmNewPassword: "NewPass@1",
    });
  });
});
