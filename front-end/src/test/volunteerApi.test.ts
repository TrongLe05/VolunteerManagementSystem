import { describe, it, expect, vi, beforeEach } from "vitest";
import { volunteerApi } from "@/api/volunteerApi";
import axiosClient from "@/api/axiosClient";

vi.mock("@/api/axiosClient", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("volunteerApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getMyProfile calls GET /volunteers/me", async () => {
    const mockProfile = {
      id: "vol-1",
      fullName: "Lê Minh",
      studentCode: "0022410001",
      consentFaceAuth: true,
    };
    vi.mocked(axiosClient.get).mockResolvedValueOnce({ data: mockProfile });

    const profile = await volunteerApi.getMyProfile();

    expect(axiosClient.get).toHaveBeenCalledWith("/volunteers/me");
    expect(profile.studentCode).toBe("0022410001");
    expect(profile.consentFaceAuth).toBe(true);
  });

  it("updateMyProfile sends consentFaceAuth and profile fields to PUT /volunteers/me", async () => {
    vi.mocked(axiosClient.put).mockResolvedValueOnce({ data: true });

    const payload = {
      fullName: "Lê Minh",
      phone: "0912345678",
      gender: "MALE",
      dateOfBirth: "2004-05-15",
      className: "ĐHCNTT22A",
      studentCode: "0022410001",
      consentFaceAuth: true,
    };

    const result = await volunteerApi.updateMyProfile(payload);

    expect(axiosClient.put).toHaveBeenCalledWith("/volunteers/me", payload);
    expect(result).toBe(true);
  });

  it("importExcel uploads excel file and organizationId via FormData", async () => {
    vi.mocked(axiosClient.post).mockResolvedValueOnce({ data: { importedCount: 25 } });

    const excelFile = new File(["dummy"], "tnv.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const res = await volunteerApi.importExcel(excelFile, "org-cntt");

    expect(axiosClient.post).toHaveBeenCalledWith(
      "/volunteers/import",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    expect(res).toEqual({ importedCount: 25 });
  });
});
