import { describe, it, expect, vi, beforeEach } from "vitest";
import { organizationApi } from "@/api/organizationApi";
import axiosClient from "@/api/axiosClient";

vi.mock("@/api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("organizationApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAll fetches organizations list with optional searchTerm", async () => {
    const mockOrgs = [{ id: "org-1", code: "DOAN_TRUONG", name: "Đoàn Trường ĐH Đồng Tháp" }];
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockOrgs });

    const res = await organizationApi.getAll("Đồng Tháp");

    expect(axiosClient.get).toHaveBeenCalledWith("/organizations", {
      params: { searchTerm: "Đồng Tháp" },
    });
    expect(res).toHaveLength(1);
  });

  it("create, update, and remove call their respective organization endpoints", async () => {
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: "org-2" });
    vi.mocked(axiosClient.put).mockResolvedValueOnce({ data: true });
    vi.mocked(axiosClient.delete).mockResolvedValueOnce({ data: true });

    const createdId = await organizationApi.create({
      parentId: "org-1",
      code: "DOAN_CNTT",
      name: "Đoàn Khoa CNTT",
    });
    expect(createdId).toBe("org-2");

    const updated = await organizationApi.update("org-2", {
      id: "org-2",
      parentId: "org-1",
      code: "DOAN_CNTT",
      name: "Liên Chi Đoàn Khoa CNTT",
      isActive: true,
    });
    expect(updated).toBe(true);

    const removed = await organizationApi.remove("org-2");
    expect(removed).toBe(true);
  });
});
