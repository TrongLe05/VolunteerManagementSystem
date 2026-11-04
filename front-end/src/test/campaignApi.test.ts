import { describe, it, expect, vi, beforeEach } from "vitest";
import { campaignApi } from "@/api/campaignApi";
import axiosClient from "@/api/axiosClient";

vi.mock("@/api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("campaignApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAll retrieves campaigns list with filters", async () => {
    const mockData = {
      items: [{ id: "camp-1", name: "Chiến dịch Mùa Hè Xanh", status: "ACTIVE" }],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
    };
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockData });

    const res = await campaignApi.getAll({ searchTerm: "Mùa Hè" });

    expect(axiosClient.get).toHaveBeenCalledWith("/campaigns", {
      params: { searchTerm: "Mùa Hè" },
    });
    expect(res.items[0].name).toBe("Chiến dịch Mùa Hè Xanh");
  });

  it("create posts new campaign to /campaigns", async () => {
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: "camp-new-id" });

    const payload = {
      organizationId: "org-1",
      name: "Xuân Tình Nguyện 2026",
      description: "Hỗ trợ Tết cho sinh viên khó khăn",
      startDate: "2026-01-10",
      endDate: "2026-02-05",
    };
    const id = await campaignApi.create(payload);

    expect(axiosClient.post).toHaveBeenCalledWith("/campaigns", payload);
    expect(id).toBe("camp-new-id");
  });

  it("update and remove call PUT and DELETE /campaigns/:id", async () => {
    vi.mocked(axiosClient.put).mockResolvedValueOnce({ data: true });
    vi.mocked(axiosClient.delete).mockResolvedValueOnce({ data: true });

    const updated = await campaignApi.update("camp-1", {
      id: "camp-1",
      name: "Xuân Tình Nguyện Updated",
      startDate: "2026-01-10",
      endDate: "2026-02-10",
      status: "ACTIVE",
    });
    expect(updated).toBe(true);
    expect(axiosClient.put).toHaveBeenCalledWith("/campaigns/camp-1", expect.any(Object));

    const removed = await campaignApi.remove("camp-1");
    expect(removed).toBe(true);
    expect(axiosClient.delete).toHaveBeenCalledWith("/campaigns/camp-1");
  });
});
