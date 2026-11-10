import { describe, it, expect, vi, beforeEach } from "vitest";
import { activityApi } from "@/api/activityApi";
import axiosClient from "@/api/axiosClient";

vi.mock("@/api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("activityApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAll fetches paginated activities with query params", async () => {
    const mockPage = {
      items: [{ id: "act-1", name: "Chủ Nhật Xanh", status: "OPEN" }],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
    };
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockPage });

    const result = await activityApi.getAll({ status: "OPEN", pageNumber: 1 });

    expect(axiosClient.get).toHaveBeenCalledWith("/activities", {
      params: { status: "OPEN", pageNumber: 1 },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].name).toBe("Chủ Nhật Xanh");
  });

  it("getManage fetches paginated activities for admin manage endpoint", async () => {
    const mockPage = {
      items: [{ id: "act-admin-1", name: "Hoạt động Đoàn", status: "DRAFT" }],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
    };
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockPage });

    const result = await activityApi.getManage({ status: "DRAFT", pageNumber: 1 });

    expect(axiosClient.get).toHaveBeenCalledWith("/activities/manage", {
      params: { status: "DRAFT", pageNumber: 1 },
    });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe("DRAFT");
  });

  it("getById fetches activity details by id", async () => {
    const mockActivity = { id: "act-1", name: "Tiếp sức mùa thi", creditDays: 0.5 };
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockActivity });

    const result = await activityApi.getById("act-1");

    expect(axiosClient.get).toHaveBeenCalledWith("/activities/act-1");
    expect(result.name).toBe("Tiếp sức mùa thi");
  });

  it("register posts to /activities/:id/register", async () => {
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: "reg-123" });

    const regId = await activityApi.register("act-99");

    expect(axiosClient.post).toHaveBeenCalledWith("/activities/act-99/register");
    expect(regId).toBe("reg-123");
  });

  it("cancelRegistration puts to /activities/:id/cancel-registration", async () => {
    vi.mocked(axiosClient.put).mockResolvedValueOnce({ data: true });

    const cancelled = await activityApi.cancelRegistration("act-99");

    expect(axiosClient.put).toHaveBeenCalledWith("/activities/act-99/cancel-registration");
    expect(cancelled).toBe(true);
  });

  it("getMyRegistrations fetches volunteer's registered activities", async () => {
    const mockPage = {
      items: [{ id: "reg-1", activityId: "act-1", registrationStatus: "APPROVED" }],
      totalCount: 1,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
    };
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockPage });

    const result = await activityApi.getMyRegistrations({ status: "APPROVED" });

    expect(axiosClient.get).toHaveBeenCalledWith("/activities/my-registrations", {
      params: { status: "APPROVED" },
    });
    expect(result.items[0].registrationStatus).toBe("APPROVED");
  });

  it("remove deletes activity via DELETE /activities/:id", async () => {
    vi.mocked(axiosClient.delete).mockResolvedValueOnce({ data: true });

    const deleted = await activityApi.remove("act-1");

    expect(axiosClient.delete).toHaveBeenCalledWith("/activities/act-1");
    expect(deleted).toBe(true);
  });
});
